"""enhance schemes table with verified government scheme fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new verified government scheme columns
    op.add_column("schemes", sa.Column("short_name", sa.String(length=100), nullable=True))
    op.add_column("schemes", sa.Column("scheme_type", sa.String(length=50), server_default="central", nullable=False))
    op.create_index(op.f("ix_schemes_scheme_type"), "schemes", ["scheme_type"], unique=False)

    op.add_column("schemes", sa.Column("target_beneficiaries", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False))
    op.add_column("schemes", sa.Column("application_process", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False))

    op.add_column("schemes", sa.Column("source", sa.String(length=255), server_default="Government of India", nullable=False))
    op.add_column("schemes", sa.Column("source_url", sa.String(length=500), nullable=True))
    op.add_column("schemes", sa.Column("ministry_or_department", sa.String(length=255), nullable=True))

    op.add_column("schemes", sa.Column("active_status", sa.String(length=50), server_default="active", nullable=False))
    op.create_index(op.f("ix_schemes_active_status"), "schemes", ["active_status"], unique=False)

    op.add_column("schemes", sa.Column("start_date", sa.Date(), nullable=True))
    op.add_column("schemes", sa.Column("end_date", sa.Date(), nullable=True))
    op.add_column("schemes", sa.Column("matching_criteria", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False))


def downgrade() -> None:
    op.drop_column("schemes", "matching_criteria")
    op.drop_column("schemes", "end_date")
    op.drop_column("schemes", "start_date")
    op.drop_index(op.f("ix_schemes_active_status"), table_name="schemes")
    op.drop_column("schemes", "active_status")
    op.drop_column("schemes", "ministry_or_department")
    op.drop_column("schemes", "source_url")
    op.drop_column("schemes", "source")
    op.drop_column("schemes", "application_process")
    op.drop_column("schemes", "target_beneficiaries")
    op.drop_index(op.f("ix_schemes_scheme_type"), table_name="schemes")
    op.drop_column("schemes", "scheme_type")
    op.drop_column("schemes", "short_name")
