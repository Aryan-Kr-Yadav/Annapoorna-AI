"""
Crop Doctor router.
Implements the 2-Stage AI Diagnosis Pipeline:
Stage 1: Qwen Vision extracts visual observations and symptom patterns from photo.
Stage 2: GPT-OSS 120B synthesizes visual findings with crop lifecycle stage, soil,
         and previous inspection history to produce a structured, actionable diagnosis.

When no photo is uploaded, GPT-OSS 120B diagnoses from symptoms directly in JSON mode.
Never fabricates confidence percentages or specific chemical pesticide dosages.
"""
import base64
import json
import logging
import re
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from app.ai.service import ai_service, AIConfigError, AIResponseError
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.storage import storage
from app.models.crop import CropCycle
from app.models.diagnosis import Diagnosis, Severity
from app.models.farm import Farm
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.diagnosis import DiagnosisOut
from app.services.lifecycle_engine import calculate_lifecycle
from app.services.ownership import get_owned_crop_cycle

logger = logging.getLogger("annapoorna.crop_doctor")

router = APIRouter(tags=["crop-doctor"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


# Pydantic schema for Stage 1: Visual observations extracted by Qwen Vision
class VisualObservationsOutput(BaseModel):
    visual_symptoms: List[str] = Field(default_factory=list)
    affected_parts: List[str] = Field(default_factory=list)
    apparent_severity: str = "unknown"
    visual_hypothesis: str = "No obvious disease or pest pattern visible"
    uncertainty_notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_visual(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        for field in ["visual_symptoms", "affected_parts"]:
            val = data.get(field)
            if isinstance(val, str):
                data[field] = [s.strip("- •* ") for s in re.split(r"[,;\n]+", val) if s.strip()]
            elif val is None:
                data[field] = []
        return data


# Pydantic schema for Stage 2: Final Agronomic Analysis synthesized by GPT-OSS 120B
class DiagnosisSummaryOutput(BaseModel):
    possible_condition: str = "Condition Identified"
    severity: str = "medium"  # low | medium | high | unknown
    confidence_percentage: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_summary(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"possible_condition": data, "severity": "medium", "confidence_percentage": None}
        if isinstance(data, dict):
            cond = (
                data.get("possible_condition")
                or data.get("condition")
                or data.get("diagnosis")
                or data.get("disease")
                or "Condition Identified"
            )
            sev = data.get("severity") or data.get("apparent_severity") or "medium"
            conf = data.get("confidence_percentage")
            return {
                "possible_condition": str(cond),
                "severity": str(sev).lower(),
                "confidence_percentage": conf if isinstance(conf, (int, float)) else None,
            }
        return data


class CropDoctorAnalysisOutput(BaseModel):
    summary: DiagnosisSummaryOutput = Field(default_factory=DiagnosisSummaryOutput)
    observations: List[str] = Field(default_factory=list)
    possible_causes: List[str] = Field(default_factory=list)
    immediate_actions: List[str] = Field(default_factory=list)
    treatment_options: List[str] = Field(default_factory=list)
    prevention: List[str] = Field(default_factory=list)
    monitoring: str = "Re-inspect leaf symptoms in 2-3 days."
    when_to_seek_expert_help: str = "Consult local Krishi Vigyan Kendra or extension officer if symptoms worsen."
    disclaimer: str = "This automated analysis is for decision support only and does not substitute for on-field laboratory diagnosis."

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        # 1. Normalize summary / diagnosis
        if "summary" in data:
            pass  # Handled by DiagnosisSummaryOutput validator
        elif "diagnosis" in data:
            data["summary"] = {
                "possible_condition": str(data.get("diagnosis")),
                "severity": str(data.get("severity") or "medium"),
            }
        elif "possible_condition" in data:
            data["summary"] = {
                "possible_condition": str(data.get("possible_condition")),
                "severity": str(data.get("severity") or "medium"),
            }
        elif "condition" in data:
            data["summary"] = {
                "possible_condition": str(data.get("condition")),
                "severity": str(data.get("severity") or "medium"),
            }
        else:
            data["summary"] = {
                "possible_condition": "Crop Condition Identified",
                "severity": "medium",
            }

        # 2. Normalize list fields from alternative keys
        if not data.get("possible_causes"):
            cause = data.get("probable_cause") or data.get("causes") or data.get("cause")
            if cause:
                data["possible_causes"] = [cause] if isinstance(cause, str) else list(cause)

        if not data.get("immediate_actions"):
            actions = (
                data.get("recommended_actions")
                or data.get("actions")
                or data.get("immediate_action")
                or data.get("recommendation")
            )
            if actions:
                data["immediate_actions"] = [actions] if isinstance(actions, str) else list(actions)

        if not data.get("treatment_options"):
            treatments = data.get("treatment") or data.get("treatments") or data.get("cure")
            if treatments:
                data["treatment_options"] = [treatments] if isinstance(treatments, str) else list(treatments)

        if not data.get("prevention"):
            prev = data.get("preventative_measures") or data.get("prevention_tips") or data.get("preventive_measures")
            if prev:
                data["prevention"] = [prev] if isinstance(prev, str) else list(prev)

        # 3. Ensure all list fields are indeed lists
        for field in ["observations", "possible_causes", "immediate_actions", "treatment_options", "prevention"]:
            val = data.get(field)
            if isinstance(val, str):
                data[field] = [s.strip("- •* ") for s in val.split("\n") if s.strip()]
            elif val is None:
                data[field] = []

        return data


@router.post("/crops/{crop_id}/diagnoses", response_model=Envelope[DiagnosisOut])
async def create_diagnosis(
    crop_id: UUID,
    symptoms_reported: str = Form(default=""),
    image: UploadFile | None = File(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    farm = db.query(Farm).filter(Farm.id == crop.farm_id).first()

    # Read image bytes if provided
    image_bytes: bytes | None = None
    image_content_type: str | None = None
    if image:
        if image.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, or WebP image.")
        image_bytes = await image.read()
        image_content_type = image.content_type or "image/jpeg"
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=400, detail="Image is too large (max 5MB).")

    # Try to permanently store image (optional)
    image_url: str | None = None
    if image_bytes:
        try:
            image_url = storage.upload_image(image_bytes, f"diagnosis-{crop_id}-{image.filename}")
        except RuntimeError:
            logger.info("Image storage not configured; proceeding with direct data URL analysis.")
            image_url = None

    # Calculate crop growth stage
    lifecycle = calculate_lifecycle(crop.crop_name, crop.sowing_date)

    # Fetch recent inspection history for trend awareness
    past_diagnoses = (
        db.query(Diagnosis)
        .filter(Diagnosis.crop_cycle_id == crop.id)
        .order_by(Diagnosis.created_at.desc())
        .limit(3)
        .all()
    )
    past_history_desc = (
        "\n".join(
            f"- {d.created_at.date()}: {d.possible_condition or 'Unknown'} (Severity: {d.severity.value})"
            for d in past_diagnoses
        )
        if past_diagnoses
        else "No prior inspections recorded for this crop."
    )

    possible_condition = None
    confidence_percentage = None
    severity = Severity.UNKNOWN
    recommendation = None
    analysis_details = None

    try:
        visual_findings = None

        # STAGE 1: If image is provided, extract visual features using Qwen Vision
        if image_bytes:
            from app.core.image_utils import image_bytes_to_data_url
            try:
                data_url = image_bytes_to_data_url(image_bytes)
            except Exception as exc:
                logger.warning("Image optimization failed, using raw: %s", exc)
                b64 = base64.b64encode(image_bytes).decode("utf-8")
                mime = image_content_type or "image/jpeg"
                data_url = f"data:{mime};base64,{b64}"

            vision_url = image_url if (image_url and not image_url.startswith("data:")) else data_url

            stage1_prompt = (
                f"You are the visual inspection stage of Crop Doctor for {crop.crop_name}.\n"
                f"Reported symptoms: '{symptoms_reported or 'None reported'}'.\n"
                f"Examine the photo and extract visual observations into this JSON structure:\n"
                f"{{\n"
                f'  "visual_symptoms": ["e.g. chlorotic leaf margins", "brown concentric lesions"],\n'
                f'  "affected_parts": ["leaves", "stems"],\n'
                f'  "apparent_severity": "low | medium | high | unknown",\n'
                f'  "visual_hypothesis": "suspected condition name",\n'
                f'  "uncertainty_notes": "any blur, occlusion, or visual caveats"\n'
                f"}}"
            )

            try:
                visual_findings = await ai_service.analyze_image_structured(
                    schema=VisualObservationsOutput,
                    prompt=stage1_prompt,
                    image_url=vision_url,
                )
            except Exception as vis_err:
                logger.warning("Stage 1 visual extraction failed, falling back to text: %s", vis_err)
                visual_findings = VisualObservationsOutput(
                    visual_symptoms=["Visual features could not be automatically structured from the image."],
                    apparent_severity="unknown",
                    visual_hypothesis="Condition requires physical check",
                )

        # STAGE 2: GPT-OSS 120B Agronomic Reasoning
        visual_text = ""
        if visual_findings:
            visual_text = (
                f"- Visual Symptoms Observed: {', '.join(visual_findings.visual_symptoms)}\n"
                f"- Affected Plant Parts: {', '.join(visual_findings.affected_parts)}\n"
                f"- Apparent Visual Severity: {visual_findings.apparent_severity}\n"
                f"- Visual Hypothesis: {visual_findings.visual_hypothesis}\n"
                f"- Notes: {visual_findings.uncertainty_notes or 'None'}"
            )
        else:
            visual_text = "No image provided. Relying on farmer's described symptoms."

        farm_loc = f"{farm.district}, {farm.state}" if farm else "India"
        soil_type = farm.soil_type if farm else "Not specified"
        irr_type = farm.irrigation_type.value if farm else "Not specified"

        stage2_prompt = (
            f"You are Annapoorna AI Senior Agronomist diagnosing crop health.\n\n"
            f"CROP CONTEXT:\n"
            f"- Crop: {crop.crop_name} (Variety: {crop.variety or 'Standard'})\n"
            f"- Growth Stage: {lifecycle.current_stage} (Day {lifecycle.day_number} after sowing)\n"
            f"- Location: {farm_loc}\n"
            f"- Soil: {soil_type} | Irrigation: {irr_type}\n\n"
            f"FARMER'S REPORTED SYMPTOMS:\n"
            f"{symptoms_reported or 'None reported by farmer.'}\n\n"
            f"STAGE 1 VISUAL OBSERVATIONS (from Vision Model):\n"
            f"{visual_text}\n\n"
            f"PREVIOUS INSPECTIONS HISTORY:\n"
            f"{past_history_desc}\n\n"
            f"CRITICAL RULES:\n"
            f"1. Synthesize all evidence into an accurate, practical diagnosis.\n"
            f"2. Never invent a confidence percentage — set confidence_percentage to null.\n"
            f"3. NEVER prescribe specific chemical milliliter or gram dosages for pesticides or fungicides. "
            f"Recommend approved active ingredient classes or cultural solutions, and advise checking product labels.\n"
            f"4. Respond strictly with JSON conforming to CropDoctorAnalysisOutput."
        )

        analysis = await ai_service.generate_structured(
            schema=CropDoctorAnalysisOutput,
            prompt=stage2_prompt,
            reasoning_effort="medium",
        )

        possible_condition = analysis.summary.possible_condition
        confidence_percentage = analysis.summary.confidence_percentage
        try:
            severity = Severity(analysis.summary.severity.lower())
        except ValueError:
            severity = Severity.UNKNOWN

        analysis_details = {
            "observations": analysis.observations,
            "possible_causes": analysis.possible_causes,
            "immediate_actions": analysis.immediate_actions,
            "treatment_options": analysis.treatment_options,
            "prevention": analysis.prevention,
            "monitoring": analysis.monitoring,
            "when_to_seek_expert_help": analysis.when_to_seek_expert_help,
            "disclaimer": analysis.disclaimer,
        }

        # Build clean formatted recommendation markdown
        rec_parts = []
        if analysis.immediate_actions:
            rec_parts.append("**Immediate Actions Today:**\n" + "\n".join(f"• {a}" for a in analysis.immediate_actions))
        if analysis.treatment_options:
            rec_parts.append("\n\n**Treatment Options:**\n" + "\n".join(f"• {t}" for t in analysis.treatment_options))
        if analysis.prevention:
            rec_parts.append("\n\n**Prevention & Cultural Practices:**\n" + "\n".join(f"• {p}" for p in analysis.prevention))
        if analysis.monitoring:
            rec_parts.append(f"\n\n**Monitoring:** {analysis.monitoring}")
        if analysis.when_to_seek_expert_help:
            rec_parts.append(f"\n\n**When to Seek Expert Help:** {analysis.when_to_seek_expert_help}")

        recommendation = "".join(rec_parts) if rec_parts else "Please monitor the crop and consult local agricultural extension if symptoms persist."

    except (AIConfigError, AIResponseError) as exc:
        logger.warning("Crop Doctor AI call failed: %s", exc)
        recommendation = (
            "Automated diagnosis is temporarily unavailable. Your symptoms have been logged — "
            "please try running the inspection again in a moment, or consult your local extension officer."
        )
    except Exception as exc:
        logger.exception("Unexpected error in Crop Doctor diagnosis: %s", exc)
        recommendation = "An unexpected issue occurred while analyzing the crop condition. Please try again."

    # Follow-up detection: true if there are prior inspections for this crop cycle
    is_follow_up = len(past_diagnoses) > 0

    diag = Diagnosis(
        crop_cycle_id=crop.id,
        image_url=image_url,
        symptoms_reported=symptoms_reported or None,
        possible_condition=possible_condition,
        confidence_percentage=confidence_percentage,
        severity=severity,
        recommendation=recommendation,
        is_follow_up=is_follow_up,
        analysis_details=analysis_details,
    )
    db.add(diag)
    db.commit()
    db.refresh(diag)
    return Envelope(message="Diagnosis recorded.", data=DiagnosisOut.model_validate(diag))


@router.get("/crops/{crop_id}/diagnoses", response_model=Envelope[list[DiagnosisOut]])
def list_diagnoses(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    diagnoses = (
        db.query(Diagnosis)
        .filter(Diagnosis.crop_cycle_id == crop.id)
        .order_by(Diagnosis.created_at.desc())
        .all()
    )
    return Envelope(data=[DiagnosisOut.model_validate(d) for d in diagnoses])
