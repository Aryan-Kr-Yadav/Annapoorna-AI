"""
Backend-side filtering for the scheme navigator. Groq never decides
eligibility — it may only explain a scheme's already-stored details in
plain language. Filtering here is deliberately simple string/JSON
matching, not a scored ranking, to avoid implying more precision than
the underlying data supports.
"""
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.scheme import Scheme


def find_relevant_schemes(
    db: Session, state: Optional[str] = None, category: Optional[str] = None, crop: Optional[str] = None
) -> list[dict]:
    query = db.query(Scheme)
    if state:
        query = query.filter(or_(Scheme.state.is_(None), Scheme.state == state, Scheme.scope == "national"))
    if category:
        query = query.filter(Scheme.category == category)

    schemes = query.all()

    results = []
    for scheme in schemes:
        relevance_note = None
        if crop and scheme.applicable_crops:
            crop_match = crop.lower() in [c.lower() for c in scheme.applicable_crops]
            if not crop_match:
                continue
            relevance_note = "Potentially relevant based on your selected crop."
        elif state and scheme.state == state:
            relevance_note = f"Potentially relevant — available in {state}."
        elif scheme.scope == "national":
            relevance_note = "National scheme — potentially relevant regardless of state."

        results.append({**scheme.__dict__, "relevance_note": relevance_note})

    return results
