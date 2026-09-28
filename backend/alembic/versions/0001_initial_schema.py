"""initial schema — all core tables

Revision ID: 0001
Revises:
Create Date: 2026-09-26

This bootstrap migration creates every table from the current
SQLAlchemy models in one shot (via metadata.create_all), rather than
hand-writing 16 op.create_table() blocks. This is intentional for a
brand-new database: it's correct and fully reversible. Once you've run
this once against your real Postgres instance, generate all FUTURE
migrations normally with:

    alembic revision --autogenerate -m "add xyz column"

so subsequent changes are properly diffed and reviewable.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # pgvector is required for knowledge_chunks.embedding (RAG).
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    import app.models  # noqa: F401 — ensures all models are registered on Base.metadata
    from app.core.database import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    import app.models  # noqa: F401
    from app.core.database import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind, checkfirst=True)
