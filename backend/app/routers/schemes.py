import json
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.ai.service import ai_service
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.scheme import Scheme
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.scheme import (
    SchemeExplainOut,
    SchemeExplainRequest,
    SchemeOut,
    SchemeRecommendationOut,
)
from app.services.ownership import get_owned_farm
from app.services.scheme_matching_service import (
    FarmerContext,
    SchemeMatchingService,
    get_farmer_context,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("", response_model=Envelope[list[SchemeOut]])
def list_schemes(
    state: Optional[str] = None,
    category: Optional[str] = None,
    crop: Optional[str] = None,
    scheme_type: Optional[str] = None,
    q: Optional[str] = None,
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    List schemes with optional filters (state, category, crop, scheme_type, search query).
    Returns verified active schemes.
    """
    query = db.query(Scheme).filter(Scheme.active_status.is_(True))

    if scheme_type:
        query = query.filter(Scheme.scheme_type == scheme_type.lower())

    if state:
        query = query.filter(
            or_(
                Scheme.state.is_(None),
                Scheme.state.ilike(f"%{state}%"),
                Scheme.scheme_type == "central",
            )
        )

    if category:
        query = query.filter(Scheme.category.ilike(f"%{category}%"))

    if q:
        query = query.filter(
            or_(
                Scheme.name.ilike(f"%{q}%"),
                Scheme.short_name.ilike(f"%{q}%"),
                Scheme.description.ilike(f"%{q}%"),
                Scheme.category.ilike(f"%{q}%"),
                Scheme.ministry_or_department.ilike(f"%{q}%"),
            )
        )

    schemes = query.all()

    # Filter crop if specified
    if crop:
        filtered = []
        crop_lower = crop.lower()
        for scheme in schemes:
            crops = scheme.applicable_crops or (scheme.matching_criteria or {}).get("eligible_crops") or []
            if not crops:
                filtered.append(scheme)
            elif any(crop_lower in c.lower() or c.lower() in crop_lower for c in crops):
                filtered.append(scheme)
        schemes = filtered

    results = []
    for s in schemes:
        if hasattr(SchemeOut, "model_validate"):
            results.append(SchemeOut.model_validate(s))
        else:
            results.append(SchemeOut.from_orm(s))

    return Envelope(data=results)


@router.get("/recommended", response_model=Envelope[list[SchemeRecommendationOut]])
def get_recommended_schemes(
    farm_id: Optional[UUID] = None,
    category: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get profile-aware recommended schemes for the authenticated farmer.
    Uses farm profile (state, district, farm size, crops, irrigation, soil)
    to deterministically evaluate scheme relevance.
    """
    if farm_id:
        # Strictly verify farm ownership to avoid accessing another user's farm
        get_owned_farm(db, farm_id=farm_id, user_id=user.id)

    context: FarmerContext = get_farmer_context(db, user_id=user.id, farm_id=farm_id)
    recommendations = SchemeMatchingService.get_recommendations(db, context, category=category)
    return Envelope(data=recommendations)


@router.get("/search", response_model=Envelope[list[SchemeOut]])
def search_schemes(
    q: str = Query(..., min_length=1),
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Keyword search across scheme title, short name, category, and department.
    """
    query = db.query(Scheme).filter(
        Scheme.active_status.is_(True),
        or_(
            Scheme.name.ilike(f"%{q}%"),
            Scheme.short_name.ilike(f"%{q}%"),
            Scheme.description.ilike(f"%{q}%"),
            Scheme.category.ilike(f"%{q}%"),
            Scheme.ministry_or_department.ilike(f"%{q}%"),
        ),
    )
    schemes = query.all()
    results = [
        SchemeOut.model_validate(s) if hasattr(SchemeOut, "model_validate") else SchemeOut.from_orm(s)
        for s in schemes
    ]
    return Envelope(data=results)


@router.get("/{scheme_id}", response_model=Envelope[SchemeOut])
def get_scheme(
    scheme_id: UUID,
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch full verified details for a single government scheme.
    """
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Government scheme not found.")

    res = SchemeOut.model_validate(scheme) if hasattr(SchemeOut, "model_validate") else SchemeOut.from_orm(scheme)
    return Envelope(data=res)


@router.post("/{scheme_id}/explain", response_model=Envelope[SchemeExplainOut])
async def explain_scheme(
    scheme_id: UUID,
    payload: SchemeExplainRequest,
    user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Uses Groq to explain verified official scheme information in plain language
    (English, Hindi, or Hinglish).
    CRITICAL CONSTRAINT: Groq is ONLY passed verified scheme fields from the database.
    Groq is strictly instructed NEVER to invent facts, subsidy amounts, or eligibility rules.
    If Groq is unreachable, falls back gracefully to structured verified fields.
    """
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Government scheme not found.")

    lang = payload.language.lower() if payload.language else "en"
    lang_label = "Hindi" if lang in ["hi", "hindi"] else "Hinglish" if lang in ["hinglish"] else "simple English"

    # Prepare grounded verified context
    verified_context = {
        "scheme_name": scheme.name,
        "short_name": scheme.short_name,
        "ministry_or_department": scheme.ministry_or_department,
        "scheme_type": scheme.scheme_type,
        "state": scheme.state or "All India (Central)",
        "benefits": scheme.benefits,
        "eligibility": scheme.eligibility,
        "documents_required": scheme.required_documents,
        "application_process": scheme.application_process,
        "official_url": scheme.official_url,
        "last_verified": str(scheme.last_verified) if scheme.last_verified else "Official government notification",
    }

    user_query = payload.question or "Please explain the benefits, eligibility requirements, and how to apply in simple words."

    system_prompt = (
        "You are Annapoorna AI's Government Scheme Explainer for Indian farmers.\n"
        f"Explain this verified official government scheme in {lang_label}.\n\n"
        "STRUCTURAL FORMAT REQUIREMENTS:\n"
        "Your response MUST be organized with clear Markdown headings (##) and bullet points in this exact sequence:\n"
        "## 🌾 Scheme Overview\n"
        "(A clear 1-2 sentence plain-language summary of what this scheme is and why it exists)\n\n"
        "## 🎁 Key Benefits & Financial Assistance\n"
        "(Bullet points of exact subsidies, monetary assistance, insurance cover, or equipment provided)\n\n"
        "## 👤 Who is Eligible?\n"
        "(Bullet points of exact farmer eligibility criteria, land limits, or categories)\n\n"
        "## 📄 Required Documents\n"
        "(Bullet points of needed documents like Aadhaar, Land records/Khasra-Khatauni, Bank passbook, etc.)\n\n"
        "## 📝 How to Apply\n"
        "(Step-by-step guidance on applying via the official website, CSC center, or state agriculture office)\n\n"
        "## ⚠️ Important Advisory\n"
        f"(Direct link to verify and apply: {scheme.official_url or 'Official government portal'}. Remind never to pay middlemen.)\n\n"
        "CRITICAL RULES:\n"
        "1. Rely ONLY on the VERIFIED SCHEME DATA provided below.\n"
        "2. Do NOT invent, assume, or hallucinate any financial amounts, benefits, deadlines, documents, or rules.\n"
        "3. If any specific detail (e.g. exact document or deadline) is not mentioned in the verified data, clearly state: 'Please confirm this specific requirement on the official portal.'\n"
        "4. Tone must be encouraging, respectful, and farmer-friendly without overly bureaucratic jargon.\n\n"
        f"VERIFIED SCHEME DATA:\n{json.dumps(verified_context, indent=2, ensure_ascii=False)}"
    )

    explanation_text = ""
    try:
        explanation_text = await ai_service.generate_text(
            prompt=user_query,
            system_prompt=system_prompt,
            reasoning_effort="medium",
            temperature=0.3,
        )
    except Exception as exc:
        logger.warning(f"Groq scheme explanation failed, falling back to verified text: {exc}")
        # Deterministic fallback text directly from verified data formatted in the same clean structure
        benefits_list = "\n".join(f"- {b}" for b in scheme.benefits) if scheme.benefits else "- Refer to official portal for current financial terms."
        elig_list = (
            "\n".join(f"- {e}" for e in scheme.eligibility)
            if isinstance(scheme.eligibility, list)
            else f"- {scheme.eligibility}"
        ) if scheme.eligibility else "- Small and marginal farmers as per state and central guidelines."
        docs_list = "\n".join(f"- {d}" for d in scheme.required_documents) if scheme.required_documents else "- Aadhaar card, Land ownership / record, Active bank account details."
        app_process = scheme.application_process or "Apply online through the official scheme portal or visit your nearest Common Service Centre (CSC) or District Agriculture Officer."

        if lang in ["hi", "hindi"]:
            explanation_text = (
                f"## 🌾 योजना का विवरण: {scheme.name} ({scheme.short_name or ''})\n\n"
                f"{scheme.description or 'यह भारत सरकार / राज्य सरकार द्वारा किसानों के कल्याण हेतु चलाई जा रही एक प्रमुख कृषि योजना है।'}\n\n"
                f"## 🎁 मुख्य लाभ एवं वित्तीय सहायता\n{benefits_list}\n\n"
                f"## 👤 पात्रता शर्तें\n{elig_list}\n\n"
                f"## 📄 आवश्यक दस्तावेज\n{docs_list}\n\n"
                f"## 📝 आवेदन कैसे करें\n- {app_process}\n\n"
                f"## ⚠️ महत्वपूर्ण सलाह\n"
                f"आवेदन करने से पहले कृपया आधिकारिक पोर्टल पर नवीनतम विवरण सत्यापित करें: {scheme.official_url or 'आधिकारिक पोर्टल'}"
            )
        else:
            explanation_text = (
                f"## 🌾 Scheme Overview: {scheme.name} ({scheme.short_name or ''})\n\n"
                f"{scheme.description or 'Official agricultural scheme to support farmers with financial and operational assistance.'}\n\n"
                f"## 🎁 Key Benefits & Financial Assistance\n{benefits_list}\n\n"
                f"## 👤 Who is Eligible?\n{elig_list}\n\n"
                f"## 📄 Required Documents\n{docs_list}\n\n"
                f"## 📝 How to Apply\n- {app_process}\n\n"
                f"## ⚠️ Important Advisory\n"
                f"Please verify final eligibility and application dates on the official portal: {scheme.official_url or 'Official Portal'}"
            )

    return Envelope(
        data=SchemeExplainOut(
            explanation=explanation_text,
            language=lang,
            scheme_name=scheme.name,
            official_source=scheme.source or scheme.ministry_or_department,
            official_url=scheme.official_url or scheme.source_url,
            last_verified=scheme.last_verified,
        )
    )
