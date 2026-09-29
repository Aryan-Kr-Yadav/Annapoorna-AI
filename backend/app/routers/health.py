"""
Crop Doctor router. Accepts an image and/or symptom text, calls Groq
for an interpretation, and stores the result — honestly, never
fabricating a confidence score if Groq doesn't provide a calibrated one.

Image analysis works even without Cloudinary configured: the image is
converted to a base64 data URL and sent directly to Groq's vision API.
Permanent image storage (Cloudinary/S3) is only required if you want
to save images long-term.
"""
import base64
import json
import logging
import re
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.storage import storage
from app.models.diagnosis import Diagnosis, Severity
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.diagnosis import DiagnosisOut
from app.services.ownership import get_owned_crop_cycle

logger = logging.getLogger("annapoorna.crop_doctor")

router = APIRouter(tags=["crop-doctor"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024

# Comprehensive Crop Doctor prompt that produces actionable guidance
CROP_DOCTOR_PROMPT = """You are an expert agricultural crop health advisor for the crop '{crop_name}'.

Reported symptoms (if any): '{symptoms}'

Analyze the available information thoroughly and respond ONLY with a valid JSON object matching this structure:

{{
  "summary": {{
    "possible_condition": "Name of the condition or 'No major issue observed / Healthy'",
    "severity": "low | medium | high | unknown",
    "confidence_percentage": null
  }},
  "observations": [
    "Specific visual or symptom observations"
  ],
  "possible_causes": [
    "Likely pathogen, nutritional, pest, or environmental factors"
  ],
  "immediate_actions": [
    "Specific practical step farmer must take TODAY"
  ],
  "treatment_options": [
    "Recommended responsible agronomic/chemical/biological treatment guidance without fabricating exact dosages"
  ],
  "prevention": [
    "Key cultural/management practices to prevent recurrence"
  ],
  "monitoring": "Specific guidance on what to check and within how many days (e.g., re-inspect in 2-3 days)",
  "when_to_seek_expert_help": "Clear conditions indicating when local extension officer or agronomist visit is critical",
  "disclaimer": "This automated analysis is for decision support only and does not substitute for on-field laboratory diagnosis."
}}

CRITICAL RULES:
- Set confidence_percentage ONLY if you have a genuinely calibrated confidence estimate; otherwise set to null. Never invent a confidence score.
- NEVER invent or prescribe specific milliliter/gram chemical fungicide/pesticide dosages. Recommend approved active ingredient classes or general spray practices and direct farmer to product label / local agricultural extension.
- Do not claim absolute certainty where visual evidence is limited.
- Respond ONLY with the JSON object. Do not include markdown ticks, explanations, or commentary outside the JSON.
"""


@router.post("/crops/{crop_id}/diagnoses", response_model=Envelope[DiagnosisOut])
async def create_diagnosis(
    crop_id: UUID,
    symptoms_reported: str = Form(default=""),
    image: UploadFile | None = File(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)

    if not image and not symptoms_reported.strip():
        raise HTTPException(status_code=400, detail="Provide an image, symptom description, or both.")

    # Read image bytes if provided (for both storage and AI analysis)
    image_bytes: bytes | None = None
    image_content_type: str | None = None
    if image:
        if image.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, or WebP image.")
        image_bytes = await image.read()
        image_content_type = image.content_type or "image/jpeg"
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=400, detail="Image is too large (max 5MB).")

    # Try to permanently store the image (optional — analysis works without this)
    image_url: str | None = None
    if image_bytes:
        try:
            image_url = storage.upload_image(image_bytes, f"diagnosis-{crop_id}-{image.filename}")
        except RuntimeError:
            # Storage not configured — that's OK, we can still analyze the image
            logger.info("Image storage not configured; proceeding with analysis only (image won't be permanently saved).")
            image_url = None

    from app.ai.groq_client import GroqConfigError, GroqResponseError, vision_completion, chat_completion

    possible_condition = None
    confidence_percentage = None
    severity = Severity.UNKNOWN
    recommendation = None

    prompt = CROP_DOCTOR_PROMPT.format(
        crop_name=crop.crop_name,
        symptoms=symptoms_reported or "none provided",
    )

    try:
        if image_bytes:
            # Build a base64 data URL for Groq vision
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            mime = image_content_type or "image/jpeg"
            data_url = f"data:{mime};base64,{b64}"
            # Use the stored URL if available, otherwise use base64 data URL
            vision_url = image_url if image_url else data_url
            raw_text = await vision_completion(prompt, vision_url)
        else:
            message = await chat_completion([{"role": "user", "content": prompt}])
            raw_text = message.get("content", "")

        cleaned = re.sub(r"^```json\s*|```\s*$", "", raw_text.strip())
        # Also handle cases where there's extra text before/after JSON
        json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group(0)
        result = json.loads(cleaned)

        summary = result.get("summary") if isinstance(result.get("summary"), dict) else {}
        possible_condition = summary.get("possible_condition") or result.get("possible_condition")
        confidence_percentage = summary.get("confidence_percentage") if summary.get("confidence_percentage") is not None else result.get("confidence_percentage")
        severity_str = (summary.get("severity") or result.get("severity") or "unknown").lower()
        try:
            severity = Severity(severity_str)
        except ValueError:
            severity = Severity.UNKNOWN

        # Build comprehensive recommendation from all available fields
        rec_parts = []
        if result.get("recommendation"):
            rec_parts.append(result["recommendation"])

        # Append structured guidance sections if present and not already in recommendation
        for section_key, section_label in [
            ("observations", "Observations"),
            ("possible_causes", "Possible Causes"),
            ("immediate_actions", "Immediate Actions"),
            ("treatment_options", "Treatment Options"),
            ("prevention", "Prevention"),
            ("monitoring", "What to Monitor"),
        ]:
            items = result.get(section_key)
            if items and isinstance(items, list) and len(items) > 0:
                rec_parts.append(f"\n\n**{section_label}:**\n" + "\n".join(f"• {item}" for item in items))

        expert_help = result.get("when_to_seek_expert_help")
        if expert_help:
            rec_parts.append(f"\n\n**When to Seek Expert Help:** {expert_help}")

        recommendation = "".join(rec_parts) if rec_parts else None

    except (GroqConfigError, GroqResponseError) as exc:
        logger.warning("Crop Doctor AI call failed: %s", exc)
        recommendation = (
            "Automated analysis is temporarily unavailable. Your symptoms have been saved — "
            "please try running the analysis again in a moment, or consult a local agronomist."
        )
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        logger.warning("Crop Doctor AI response parsing failed: %s", exc)
        recommendation = (
            "The AI analysis returned an unexpected format. Your symptoms have been saved — "
            "please try again, or consult a local agronomist."
        )
    except Exception as exc:
        logger.exception("Unexpected Crop Doctor error: %s", exc)
        recommendation = (
            "Automated analysis is temporarily unavailable. Your image and symptoms have been saved — "
            "please try running the analysis again in a moment, or consult a local agronomist."
        )

    # Prepare structured analysis details
    analysis_details = None
    if isinstance(result, dict):
        analysis_details = {
            "possible_condition": possible_condition,
            "severity": severity.value,
            "confidence_percentage": confidence_percentage,
            "observations": result.get("observations") or [],
            "possible_causes": result.get("possible_causes") or [],
            "immediate_actions": result.get("immediate_actions") or [],
            "treatment_options": result.get("treatment_options") or [],
            "prevention": result.get("prevention") or [],
            "monitoring": result.get("monitoring") or "Inspect the affected crop area again in 2–3 days to check if symptoms are spreading.",
            "when_to_seek_expert_help": result.get("when_to_seek_expert_help") or "If wilting or leaf drop spreads rapidly across >20% of your crop, consult your local Krishi Vigyan Kendra (KVK) or extension officer immediately.",
            "disclaimer": result.get("disclaimer") or "Image-based AI analysis is for decision support and does not replace a certified laboratory or agricultural extension diagnosis."
        }

    diagnosis = Diagnosis(
        crop_cycle_id=crop.id,
        image_url=image_url,
        symptoms_reported=symptoms_reported or None,
        possible_condition=possible_condition,
        confidence_percentage=confidence_percentage,
        severity=severity,
        recommendation=recommendation,
        analysis_details=analysis_details,
    )
    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)
    return Envelope(message="Inspection saved.", data=DiagnosisOut.model_validate(diagnosis))


@router.get("/crops/{crop_id}/diagnoses", response_model=Envelope[list[DiagnosisOut]])
def list_diagnoses(
    crop_id: UUID,
    severity: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    query = db.query(Diagnosis).filter(Diagnosis.crop_cycle_id == crop.id)
    if severity and severity.lower() in [s.value for s in Severity]:
        query = query.filter(Diagnosis.severity == Severity(severity.lower()))
    diagnoses = query.order_by(Diagnosis.created_at.desc()).all()
    return Envelope(data=[DiagnosisOut.model_validate(d) for d in diagnoses])
