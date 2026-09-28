"""alter active_status to boolean

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-28
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert active_status column to boolean
    op.execute(
        "ALTER TABLE schemes ALTER COLUMN active_status DROP DEFAULT"
    )
    op.execute(
        "ALTER TABLE schemes ALTER COLUMN active_status TYPE boolean USING (active_status IN ('active', 'true', '1'))"
    )
    op.execute(
        "ALTER TABLE schemes ALTER COLUMN active_status SET DEFAULT true"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE schemes ALTER COLUMN active_status DROP DEFAULT"
    )
    op.execute(
        "ALTER TABLE schemes ALTER COLUMN active_status TYPE varchar(50) USING (CASE WHEN active_status IS true THEN 'active' ELSE 'inactive' END)"
    )
    op.execute(
        "ALTER TABLE schemes ALTER COLUMN active_status SET DEFAULT 'active'"
    )
