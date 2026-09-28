from datetime import date, datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SchemeOut(BaseModel):
    id: UUID
    name: str
    short_name: Optional[str] = None
    description: str
    category: str
    scheme_type: str = "central"
    scope: str = "national"
    state: Optional[str] = None
    target_beneficiaries: Optional[List[str]] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    eligibility: Any = Field(default_factory=list)
    documents_required: List[str] = Field(default_factory=list)
    application_process: Optional[List[str]] = Field(default_factory=list)
    official_url: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    ministry_or_department: Optional[str] = None
    active_status: bool = True
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    last_verified: Optional[date] = None
    matching_criteria: Optional[dict] = Field(default_factory=dict)
    relevance_note: Optional[str] = None

    class Config:
        from_attributes = True


class SchemeMatchDetails(BaseModel):
    status: str = "potential_match"
    reasons: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    relevance_score: Optional[int] = None


class SchemeRecommendationOut(BaseModel):
    scheme: SchemeOut
    match: SchemeMatchDetails


class SchemeExplainRequest(BaseModel):
    language: str = "en"  # "en", "hi", "hinglish"
    question: Optional[str] = None


class SchemeExplainOut(BaseModel):
    explanation: str
    language: str
    scheme_name: str
    official_source: Optional[str] = None
    official_url: Optional[str] = None
    last_verified: Optional[date] = None
    disclaimer: str = (
        "Scheme information and eligibility requirements can change. "
        "Verify current details and final eligibility on the official government portal before applying."
    )
