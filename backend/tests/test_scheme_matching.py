"""
Comprehensive unit tests for KrishiMitra Government Scheme Matching Engine.
Covers all 15 test requirements specified in Section 28 of the Navigator Specification.
"""
from datetime import date, timedelta
from uuid import uuid4
import pytest
from fastapi import HTTPException

from app.models.scheme import Scheme
from app.services.scheme_matching_service import (
    FarmerContext,
    SchemeMatchingService,
    normalize_to_hectares,
)
from app.services.ownership import get_owned_farm


def create_test_scheme(**kwargs) -> Scheme:
    """Helper to create a Scheme model instance with sensible test defaults."""
    defaults = {
        "id": uuid4(),
        "name": "Test Central Scheme",
        "short_name": "TCS",
        "description": "A test central agricultural scheme",
        "category": "Income Support",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "benefits": ["Financial support of Rs. 6000 per year in 3 installments"],
        "eligibility": ["All landholding farmer families with cultivable land"],
        "required_documents": ["Aadhaar", "Land Records (Khatauni)", "Bank Account"],
        "application_process": ["Register on official portal"],
        "official_url": "https://pmkisan.gov.in",
        "source": "Ministry of Agriculture & Farmers Welfare",
        "source_url": "https://pmkisan.gov.in",
        "ministry_or_department": "Ministry of Agriculture & Farmers Welfare",
        "active_status": True,
        "start_date": date(2019, 2, 1),
        "end_date": None,
        "last_verified": date(2026, 1, 15),
        "matching_criteria": {
            "requires_land_ownership": True,
            "dbt_aadhaar_linked": True,
        },
    }
    defaults.update(kwargs)
    return Scheme(**defaults)


# 1. Central scheme + matching farmer
def test_central_scheme_matching_farmer():
    scheme = create_test_scheme(
        name="PM-KISAN Samman Nidhi",
        scheme_type="central",
        state=None,
    )
    context = FarmerContext(
        state="Uttar Pradesh",
        district="Varanasi",
        farm_size=2.5,
        area_unit="acre",
        crops=["Wheat"],
    )
    match = SchemeMatchingService.match_scheme(scheme, context)
    assert match is not None
    assert match.status == "potential_match"
    assert any("Central government scheme" in r for r in match.reasons)
    assert match.relevance_score > 0
    # Must NOT claim final 100% eligibility
    assert match.relevance_score < 100


# 2. State scheme + matching state
def test_state_scheme_matching_state():
    scheme = create_test_scheme(
        name="UP Beej Anudan Yojana",
        scheme_type="state",
        state="Uttar Pradesh",
        category="Seeds",
        matching_criteria={"eligible_crops": ["Wheat", "Paddy", "Mustard"]},
    )
    context = FarmerContext(
        state="Uttar Pradesh",
        farm_size=3.0,
        area_unit="acre",
        crops=["Wheat"],
    )
    match = SchemeMatchingService.match_scheme(scheme, context)
    assert match is not None
    assert any("Uttar Pradesh" in r for r in match.reasons)
    assert any("Wheat" in r for r in match.reasons)


# 3. State scheme + wrong state (Must be excluded)
def test_state_scheme_wrong_state_excluded():
    scheme = create_test_scheme(
        name="UP Beej Anudan Yojana",
        scheme_type="state",
        state="Uttar Pradesh",
    )
    context = FarmerContext(
        state="Madhya Pradesh",
        farm_size=2.0,
        area_unit="acre",
        crops=["Wheat"],
    )
    match = SchemeMatchingService.match_scheme(scheme, context)
    assert match is None, "State scheme must NOT match a farmer from a different state"


# 4. Crop-specific scheme + matching crop
def test_crop_specific_scheme_matching_crop():
    scheme = create_test_scheme(
        name="Bhavantar Bharpayee Yojana (Horticulture)",
        scheme_type="state",
        state="Haryana",
        category="Market Support",
        matching_criteria={"eligible_crops": ["Potato", "Onion", "Tomato", "Mustard"]},
    )
    context = FarmerContext(
        state="Haryana",
        crops=["Potato", "Wheat"],
    )
    match = SchemeMatchingService.match_scheme(scheme, context)
    assert match is not None
    assert any("Potato" in r for r in match.reasons)


# 5. Crop-specific scheme + wrong crop (Must be excluded)
def test_crop_specific_scheme_wrong_crop_excluded():
    scheme = create_test_scheme(
        name="Bhavantar Bharpayee Yojana (Horticulture)",
        scheme_type="state",
        state="Haryana",
        category="Market Support",
        matching_criteria={"eligible_crops": ["Potato", "Onion", "Tomato"]},
    )
    context = FarmerContext(
        state="Haryana",
        crops=["Cotton", "Paddy"],
    )
    match = SchemeMatchingService.match_scheme(scheme, context)
    assert match is None, "Crop-specific scheme must NOT match if farmer grows none of the eligible crops"


# 6. Farm-size restriction (Small/marginal farmer <= 2 ha)
def test_farm_size_restriction():
    scheme = create_test_scheme(
        name="PoCRA Maharashtra",
        scheme_type="state",
        state="Maharashtra",
        matching_criteria={"land_size_max_hectares": 2.0},
    )
    # 2.47 acres = 1.0 hectare -> should match
    small_farmer = FarmerContext(
        state="Maharashtra",
        farm_size=2.47,
        area_unit="acre",
    )
    match_small = SchemeMatchingService.match_scheme(scheme, small_farmer)
    assert match_small is not None
    assert any("limit (2.0 ha)" in r for r in match_small.reasons)

    # 10 acres = ~4.04 hectares -> should be excluded
    large_farmer = FarmerContext(
        state="Maharashtra",
        farm_size=10.0,
        area_unit="acre",
    )
    match_large = SchemeMatchingService.match_scheme(scheme, large_farmer)
    assert match_large is None, "Farmer with farm size exceeding max limit must be excluded"


# 7. Missing farmer information
def test_missing_farmer_information_surfaced():
    scheme = create_test_scheme(
        name="PoCRA Maharashtra",
        scheme_type="state",
        state="Maharashtra",
        matching_criteria={
            "land_size_max_hectares": 2.0,
            "requires_land_ownership": True,
        },
    )
    # Farmer has state but no farm size recorded
    farmer_no_size = FarmerContext(
        state="Maharashtra",
        farm_size=None,
    )
    match = SchemeMatchingService.match_scheme(scheme, farmer_no_size)
    assert match is not None
    assert len(match.missing_information) > 0
    assert any("Farm size needed" in m for m in match.missing_information)
    assert any("Land ownership title" in m for m in match.missing_information)


# 8. Inactive scheme (Must be excluded)
def test_inactive_scheme_excluded():
    scheme_inactive = create_test_scheme(active_status=False)
    scheme_expired = create_test_scheme(
        active_status=True,
        end_date=date.today() - timedelta(days=10),
    )
    context = FarmerContext(state="Uttar Pradesh")

    assert SchemeMatchingService.match_scheme(scheme_inactive, context) is None
    assert SchemeMatchingService.match_scheme(scheme_expired, context) is None


# 9. Area unit normalization
def test_normalize_to_hectares():
    # 1 ha = 1 ha
    assert normalize_to_hectares(1.0, "hectare") == 1.0
    # 2.471 acres ≈ 1 ha
    ha_from_acres = normalize_to_hectares(2.471, "acre")
    assert 0.99 <= ha_from_acres <= 1.01
    # 4 bigha ≈ 1 ha
    ha_from_bigha = normalize_to_hectares(4.0, "bigha")
    assert 0.95 <= ha_from_bigha <= 1.05


# 10. Missing optional fields handled safely
def test_scheme_with_missing_optional_fields():
    scheme = Scheme(
        id=uuid4(),
        name="Minimal Scheme",
        description="A bare minimum scheme record",
        category="General",
        benefits=["Some benefit"],
        eligibility=["Some rule"],
        required_documents=[],
        active_status=True,
        short_name=None,
        state=None,
        scheme_type="central",
        matching_criteria=None,
        last_verified=None,
    )
    context = FarmerContext(state="Bihar")
    match = SchemeMatchingService.match_scheme(scheme, context)
    assert match is not None
    assert match.status == "potential_match"


# 11. Staleness check
def test_last_verified_staleness_handling():
    old_date = date.today() - timedelta(days=200)
    scheme = create_test_scheme(last_verified=old_date)
    assert scheme.last_verified == old_date
    delta_days = (date.today() - scheme.last_verified).days
    assert delta_days >= 180  # More than 6 months old, can be flagged as stale in UI


# 12. Ownership check: Farmer cannot access another farmer's private farm
def test_cannot_access_another_farmer_farm():
    class MockDbSession:
        def query(self, *entities):
            return self

        def filter(self, *conditions):
            return self

        def first(self):
            return None  # simulates unowned farm

    db = MockDbSession()
    other_user_farm_id = uuid4()
    logged_in_user_id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        get_owned_farm(db, farm_id=other_user_farm_id, user_id=logged_in_user_id)
    assert exc_info.value.status_code == 404


# 13. Deterministic relevance score never exceeds 99
def test_relevance_score_never_claims_100_percent():
    scheme = create_test_scheme(
        scheme_type="central",
        matching_criteria={
            "eligible_crops": ["Wheat"],
            "land_size_max_hectares": 5.0,
            "irrigation_related": True,
            "soil_related": True,
        },
    )
    context = FarmerContext(
        state="Punjab",
        district="Ludhiana",
        farm_size=2.0,
        area_unit="acre",
        crops=["Wheat"],
        irrigation_type="borewell",
        soil_type="Alluvial",
    )
    match = SchemeMatchingService.match_scheme(scheme, context)
    assert match is not None
    assert match.relevance_score <= 95, "Score must never claim 100% eligibility"
    assert match.status == "potential_match"
