"""add user preferences, default_farm_id, and diagnosis analysis_details

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Add preferences and default_farm_id to users ---
    op.add_column(
        "users",
        sa.Column("preferences", sa.JSON(), server_default="{}", nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "default_farm_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("farms.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # --- Add analysis_details to diagnoses ---
    op.add_column(
        "diagnoses",
        sa.Column("analysis_details", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("diagnoses", "analysis_details")
    op.drop_column("users", "default_farm_id")
    op.drop_column("users", "preferences")
