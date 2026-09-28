"""
One-time / re-runnable seed script for the `schemes` table.

Run after your first migration:
    python -m scripts.seed_schemes

Safe to re-run: it upserts by scheme name rather than duplicating rows.
The seed data in app/data/schemes_seed.py is a small, illustrative set —
review and expand it (and fill in `last_verified` dates) before relying
on it in production, since the platform's rule is that Groq never
invents scheme details, only ever explains what's actually stored here.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.data.schemes_seed import SCHEMES_SEED
from app.models.scheme import Scheme


def run():
    db = SessionLocal()
    try:
        created, updated = 0, 0
        for entry in SCHEMES_SEED:
            entry_copy = dict(entry)
            if "active_status" in entry_copy:
                entry_copy["active_status"] = True if entry_copy["active_status"] in [True, "active", "true", "1"] else False
            existing = db.query(Scheme).filter(Scheme.name == entry_copy["name"]).first()
            if existing:
                for key, value in entry_copy.items():
                    setattr(existing, key, value)
                updated += 1
            else:
                db.add(Scheme(**entry_copy))
                created += 1
        db.commit()
        print(f"Schemes seeded: {created} created, {updated} updated.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
