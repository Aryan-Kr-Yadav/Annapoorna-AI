"""add crop_sales, crop_plans tables and 'sold' status enum value

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-29

Adds:
- crop_sales table (harvest-to-sale workflow)
- crop_plans table (crop planner persistence)
- 'sold' value to crop_cycle_status_enum
- crop_plan_status_enum type
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Add 'sold' value to crop_cycle_status_enum ---
    op.execute("ALTER TYPE crop_cycle_status_enum ADD VALUE IF NOT EXISTS 'sold'")

    # --- Create crop_plan_status_enum ---
    op.execute(
        "DO $$ BEGIN "
        "  CREATE TYPE crop_plan_status_enum AS ENUM ('draft', 'saved', 'converted', 'archived'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; "
        "END $$"
    )

    # --- crop_sales table ---
    op.create_table(
        "crop_sales",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True),
        sa.Column("crop_cycle_id", PG_UUID(as_uuid=True), sa.ForeignKey("crop_cycles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("sale_date", sa.Date(), nullable=False),
        sa.Column("quantity_sold", sa.Numeric(12, 2), nullable=False),
        sa.Column("quantity_unit", sa.String(20), server_default="quintal"),
        sa.Column("price_per_unit", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_sale_value", sa.Numeric(14, 2), nullable=False),
        sa.Column("buyer_name", sa.String(150), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        if_not_exists=True,
    )

    # --- crop_plans table ---
    op.create_table(
        "crop_plans",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", PG_UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("farm_id", PG_UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("crop_cycle_id", PG_UUID(as_uuid=True), sa.ForeignKey("crop_cycles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("crop_name", sa.String(100), nullable=False),
        sa.Column("variety", sa.String(150), nullable=True),
        sa.Column("season", sa.String(20), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("soil_context", sa.String(100), nullable=True),
        sa.Column("irrigation_context", sa.String(100), nullable=True),
        sa.Column("estimated_duration_days", sa.Integer(), nullable=True),
        sa.Column("suggested_sowing_window", sa.String(100), nullable=True),
        sa.Column("suggested_harvest_window", sa.String(100), nullable=True),
        sa.Column("plan_details", sa.JSON(), nullable=True),
        sa.Column("status", PG_ENUM("draft", "saved", "converted", "archived", name="crop_plan_status_enum", create_type=False), server_default="saved"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_table("crop_plans")
    op.drop_table("crop_sales")
    op.execute("DROP TYPE IF EXISTS crop_plan_status_enum")
    # Note: Postgres does not support removing a value from an enum;
    # to truly revert 'sold' you'd need to recreate the type.
