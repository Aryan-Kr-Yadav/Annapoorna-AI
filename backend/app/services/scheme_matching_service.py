"""
Deterministic Scheme Matching Engine for KrishiMitra AI.

CORE PRINCIPLES:
1. Groq is NEVER used for eligibility filtering or fact generation.
2. KrishiMitra NEVER claims final eligibility ("You are eligible" or "100% Eligible").
   Wording is strictly "Potentially relevant based on your profile" and "Needs verification".
3. Schemes are filtered against verified structured criteria from the database.
4. Missing farmer information is explicitly surfaced under `missing_information`.
5. Inactive or expired schemes are never recommended.
"""
from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.crop import CropCycle, CropCycleStatus
from app.models.farm import Farm
from app.models.scheme import Scheme
from app.schemas.scheme import SchemeMatchDetails, SchemeOut, SchemeRecommendationOut


def normalize_to_hectares(area: float, unit: str) -> float:
    """Normalize any supported farm area unit to hectares."""
    unit_lower = (unit or "").lower()
    if unit_lower == "hectare" or unit_lower == "ha":
        return area
    elif unit_lower == "acre" or unit_lower == "acres":
        return area * 0.404686
    elif unit_lower == "bigha":
        return area * 0.252928
    # Default fallback assumption is acres
    return area * 0.404686


class FarmerContext:
    def __init__(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        farm_size: Optional[float] = None,
        area_unit: Optional[str] = None,
        crops: Optional[List[str]] = None,
        soil_type: Optional[str] = None,
        irrigation_type: Optional[str] = None,
    ):
        self.state = state.strip() if state else None
        self.district = district.strip() if district else None
        self.farm_size = farm_size
        self.area_unit = area_unit.lower() if area_unit else "acre"
        self.farm_size_ha = normalize_to_hectares(farm_size, area_unit) if farm_size is not None else None
        self.crops = [c.strip().lower() for c in crops] if crops else []
        self.soil_type = soil_type.strip() if soil_type else None
        self.irrigation_type = irrigation_type.strip() if irrigation_type else None


def get_farmer_context(db: Session, user_id: UUID, farm_id: Optional[UUID] = None) -> FarmerContext:
    """
    Load farmer profile context from the database for the given user.
    If farm_id is provided, loads that specific farm (verifying ownership).
    Otherwise, loads the user's primary/first active farm and active crops.
    """
    farm_query = db.query(Farm).filter(Farm.user_id == user_id, Farm.is_archived.is_(False))
    if farm_id:
        farm = farm_query.filter(Farm.id == farm_id).first()
    else:
        farm = farm_query.first()

    if not farm:
        return FarmerContext()

    # Get active crop names across farm's active cycles
    active_cycles = (
        db.query(CropCycle)
        .filter(CropCycle.farm_id == farm.id, CropCycle.status == CropCycleStatus.ACTIVE)
        .all()
    )
    crop_names = list({c.crop_name for c in active_cycles if c.crop_name})

    unit_str = farm.area_unit.value if hasattr(farm.area_unit, "value") else str(farm.area_unit or "acre")
    irr_str = farm.irrigation_type.value if hasattr(farm.irrigation_type, "value") else str(farm.irrigation_type or "")

    return FarmerContext(
        state=farm.state,
        district=farm.district,
        farm_size=farm.area,
        area_unit=unit_str,
        crops=crop_names,
        soil_type=farm.soil_type,
        irrigation_type=irr_str,
    )


class SchemeMatchingService:
    @staticmethod
    def match_scheme(scheme: Scheme, context: FarmerContext) -> Optional[SchemeMatchDetails]:
        """
        Deterministically evaluates a single verified scheme against farmer context.
        Returns SchemeMatchDetails if potentially relevant, or None if definitively incompatible.
        """
        # 1. Active status check
        if not scheme.active_status:
            return None

        today = date.today()
        if scheme.end_date and scheme.end_date < today:
            return None

        reasons: List[str] = []
        missing_info: List[str] = []
        relevance_score = 40  # baseline relevance for active verified scheme

        criteria: Dict[str, Any] = scheme.matching_criteria or {}

        # 2. State Compatibility Check
        scheme_type = (scheme.scheme_type or "central").lower()
        scheme_state = scheme.state.strip() if scheme.state else None

        if scheme_type == "state" or scheme_state:
            if not context.state:
                missing_info.append(
                    f"State verification needed: Scheme is specific to {scheme_state or 'a specific state'}."
                )
            elif scheme_state and context.state.lower() != scheme_state.lower():
                # Definite incompatibility: State scheme is for a different state
                return None
            else:
                reasons.append(f"Available in your state ({scheme_state})")
                relevance_score += 25
        else:
            # Central scheme
            reasons.append("Central government scheme available across India")
            relevance_score += 15

            # If central scheme has restricted eligible states in matching_criteria
            eligible_states = criteria.get("eligible_states")
            if eligible_states and isinstance(eligible_states, list):
                states_clean = [s.strip().lower() for s in eligible_states]
                if context.state:
                    if context.state.lower() not in states_clean:
                        return None
                    reasons.append(f"State {context.state} is among eligible states for this initiative")
                    relevance_score += 10
                else:
                    missing_info.append(f"Applicable to selected states: {', '.join(eligible_states)}")

        # 3. Crop Compatibility Check
        eligible_crops = criteria.get("eligible_crops") or scheme.applicable_crops or []
        if eligible_crops and isinstance(eligible_crops, list) and len(eligible_crops) > 0:
            crops_clean = [c.strip().lower() for c in eligible_crops]
            if context.crops:
                # Check for match or substring match (e.g. 'wheat', 'rice' in 'paddy / rice')
                matched = []
                for farmer_crop in context.crops:
                    for ec in crops_clean:
                        if farmer_crop in ec or ec in farmer_crop:
                            matched.append(farmer_crop.capitalize())
                            break
                if matched:
                    reasons.append(f"Directly applicable to your active crop(s): {', '.join(set(matched))}")
                    relevance_score += 25
                else:
                    # Incompatible: farmer has recorded active crops, but none match this crop-specific scheme
                    return None
            else:
                # Farmer hasn't logged crops yet
                missing_info.append(
                    f"Crop details needed: Scheme applies to {', '.join(eligible_crops[:4])}"
                    + ("..." if len(eligible_crops) > 4 else "")
                )
        else:
            reasons.append("Applicable across all agricultural crops and horticulture")
            relevance_score += 10

        # 4. Landholding / Farm-size Check
        max_ha = criteria.get("land_size_max_hectares")
        min_ha = criteria.get("land_size_min_hectares")

        if max_ha is not None:
            if context.farm_size_ha is not None:
                if context.farm_size_ha > float(max_ha):
                    # Incompatible: farmer exceeds maximum landholding threshold
                    return None
                reasons.append(
                    f"Farm size ({context.farm_size} {context.area_unit}) falls within the maximum limit ({max_ha} ha)"
                )
                relevance_score += 15
            else:
                missing_info.append(f"Farm size needed to verify small/marginal landholding limit (up to {max_ha} ha)")

        if min_ha is not None:
            if context.farm_size_ha is not None:
                if context.farm_size_ha < float(min_ha):
                    return None
                reasons.append(f"Farm size meets the minimum operational threshold ({min_ha} ha)")
                relevance_score += 10
            else:
                missing_info.append(f"Farm size needed to verify minimum landholding threshold ({min_ha} ha)")

        # 5. Domain / Category Specific Alignment
        if criteria.get("irrigation_related") and context.irrigation_type:
            reasons.append(f"Aligns with your farm's irrigation setup ({context.irrigation_type})")
            relevance_score += 5

        if criteria.get("soil_related") and context.soil_type:
            reasons.append(f"Relevant for soil health monitoring on {context.soil_type} soil")
            relevance_score += 5

        # 6. Structured Missing Information & Unverified Requirements
        if criteria.get("requires_land_ownership"):
            missing_info.append("Land ownership title (RoR / Khasra / Khatauni) must be verified on official portal")

        if criteria.get("dbt_aadhaar_linked"):
            missing_info.append("Bank account must be Aadhaar-seeded with active DBT for benefit disbursement")

        if criteria.get("income_limit"):
            missing_info.append(f"Income threshold verification required (limit: Rs. {criteria['income_limit']})")

        # Fallback missing information if nothing specific
        if not missing_info:
            missing_info.append(
                "Final eligibility subject to institutional landholding/tax-payee exclusions on the official portal"
            )

        # Cap relevance score at 99 so it never implies 100% certainty
        relevance_score = min(relevance_score, 95)

        return SchemeMatchDetails(
            status="potential_match",
            reasons=reasons,
            missing_information=missing_info,
            relevance_score=relevance_score,
        )

    @classmethod
    def get_recommendations(
        cls, db: Session, context: FarmerContext, category: Optional[str] = None
    ) -> List[SchemeRecommendationOut]:
        """
        Queries all active schemes, applies deterministic matching,
        and returns sorted list of SchemeRecommendationOut.
        """
        query = db.query(Scheme).filter(Scheme.active_status.is_(True))
        if category:
            query = query.filter(Scheme.category == category)

        schemes = query.all()
        recommendations = []

        for scheme in schemes:
            match_details = cls.match_scheme(scheme, context)
            if match_details is not None:
                # Support Pydantic v1 and v2
                if hasattr(SchemeOut, "model_validate"):
                    scheme_out = SchemeOut.model_validate(scheme)
                else:
                    scheme_out = SchemeOut.from_orm(scheme)

                recommendations.append(
                    SchemeRecommendationOut(
                        scheme=scheme_out,
                        match=match_details,
                    )
                )

        # Sort by relevance_score descending
        recommendations.sort(key=lambda r: r.match.relevance_score or 0, reverse=True)
        return recommendations
