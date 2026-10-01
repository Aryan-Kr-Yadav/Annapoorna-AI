from datetime import date, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.crop import CropCycle, CropCycleStatus, Season
from app.models.harvest import Harvest
from app.models.sale import CropSale
from app.models.user import User
from app.routers.harvests import delete_crop_sale, delete_harvest, record_crop_sale
from app.schemas.sale import CropSaleCreate


def _setup_mock_db(crop, harvests, sales):
    db = MagicMock()
    # Mock ownership check
    db.query.return_value.join.return_value.filter.return_value.first.return_value = crop

    # When query().filter().all() is called
    harvest_mock = MagicMock()
    harvest_mock.all.return_value = harvests
    harvest_mock.count.return_value = len(harvests)

    sale_mock = MagicMock()
    sale_mock.all.return_value = sales
    sale_mock.count.return_value = len(sales)

    def query_side_effect(entity, *args):
        q = MagicMock()
        if entity is Harvest:
            q.filter.return_value = harvest_mock
            return q
        elif entity is CropSale:
            q.filter.return_value = sale_mock
            return q
        q.join.return_value.filter.return_value.first.return_value = crop
        return q

    db.query.side_effect = query_side_effect

    def add_side_effect(instance):
        if not getattr(instance, "id", None):
            instance.id = uuid4()
        if not getattr(instance, "created_at", None):
            instance.created_at = datetime.utcnow()
        if not getattr(instance, "updated_at", None):
            instance.updated_at = datetime.utcnow()

    db.add.side_effect = add_side_effect
    return db


def test_record_crop_sale_partial_keeps_harvested_status():
    """Verify that a partial sale leaves crop status as HARVESTED."""
    user = User(id=uuid4(), email="farmer@test.com")
    crop = CropCycle(
        id=uuid4(),
        farm_id=uuid4(),
        crop_name="Wheat",
        season=Season.RABI,
        year=2026,
        sowing_date=date(2026, 11, 1),
        status=CropCycleStatus.HARVESTED,
    )

    harvest = Harvest(
        id=uuid4(),
        crop_cycle_id=crop.id,
        yield_quantity=100.0,
        yield_unit="quintal",
        harvest_date=date(2026, 4, 1),
    )

    db = _setup_mock_db(crop, [harvest], [])

    payload = CropSaleCreate(
        sale_date=date(2026, 4, 10),
        quantity_sold=40.0,
        quantity_unit="quintal",
        price_per_unit=2500.0,
        buyer_name="Local Mandi",
    )

    envelope = record_crop_sale(crop.id, payload, user=user, db=db)
    sale_out = envelope.data
    assert sale_out.quantity_sold == 40.0
    assert sale_out.total_sale_value == 100000.0
    # Status should remain HARVESTED because 60 quintal remain unsold
    assert crop.status == CropCycleStatus.HARVESTED


def test_record_crop_sale_final_transitions_to_sold():
    """Verify that selling all remaining inventory transitions status to SOLD."""
    user = User(id=uuid4(), email="farmer@test.com")
    crop = CropCycle(
        id=uuid4(),
        farm_id=uuid4(),
        crop_name="Wheat",
        season=Season.RABI,
        year=2026,
        sowing_date=date(2026, 11, 1),
        status=CropCycleStatus.HARVESTED,
    )

    harvest = Harvest(
        id=uuid4(),
        crop_cycle_id=crop.id,
        yield_quantity=50.0,
        yield_unit="quintal",
        harvest_date=date(2026, 4, 1),
    )

    existing_sale = CropSale(
        id=uuid4(),
        crop_cycle_id=crop.id,
        quantity_sold=30.0,
        price_per_unit=2400.0,
        total_sale_value=72000.0,
        sale_date=date(2026, 4, 5),
    )

    db = _setup_mock_db(crop, [harvest], [existing_sale])

    # Sell remaining 20 quintals
    payload = CropSaleCreate(
        sale_date=date(2026, 4, 15),
        quantity_sold=20.0,
        quantity_unit="quintal",
        price_per_unit=2500.0,
    )

    envelope = record_crop_sale(crop.id, payload, user=user, db=db)
    assert envelope.data.quantity_sold == 20.0
    # Remaining is 0 -> crop status must transition to SOLD
    assert crop.status == CropCycleStatus.SOLD


def test_record_crop_sale_oversell_raises_400():
    """Verify that trying to sell more than unsold harvest raises HTTP 400."""
    user = User(id=uuid4(), email="farmer@test.com")
    crop = CropCycle(
        id=uuid4(),
        farm_id=uuid4(),
        crop_name="Wheat",
        season=Season.RABI,
        year=2026,
        sowing_date=date(2026, 11, 1),
        status=CropCycleStatus.HARVESTED,
    )

    harvest = Harvest(
        id=uuid4(),
        crop_cycle_id=crop.id,
        yield_quantity=20.0,
        yield_unit="quintal",
        harvest_date=date(2026, 4, 1),
    )

    db = _setup_mock_db(crop, [harvest], [])

    # Attempt to sell 25 quintal (more than 20)
    payload = CropSaleCreate(
        sale_date=date(2026, 4, 15),
        quantity_sold=25.0,
        quantity_unit="quintal",
        price_per_unit=2500.0,
    )

    with pytest.raises(HTTPException) as exc_info:
        record_crop_sale(crop.id, payload, user=user, db=db)
    assert exc_info.value.status_code == 400
    assert "Maximum available remaining harvested produce" in str(exc_info.value.detail)


def test_delete_crop_sale_restores_harvested_status():
    """Verify deleting a sale restores status to HARVESTED when stock becomes unsold."""
    user = User(id=uuid4(), email="farmer@test.com")
    crop = CropCycle(
        id=uuid4(),
        farm_id=uuid4(),
        crop_name="Wheat",
        season=Season.RABI,
        year=2026,
        sowing_date=date(2026, 11, 1),
        status=CropCycleStatus.SOLD,
    )

    sale_to_delete = CropSale(
        id=uuid4(),
        crop_cycle_id=crop.id,
        quantity_sold=50.0,
        price_per_unit=2500.0,
        total_sale_value=125000.0,
        sale_date=date(2026, 4, 15),
    )

    harvest = Harvest(
        id=uuid4(),
        crop_cycle_id=crop.id,
        yield_quantity=50.0,
        yield_unit="quintal",
        harvest_date=date(2026, 4, 1),
    )

    db = _setup_mock_db(crop, [harvest], [])
    sale_query = MagicMock()
    sale_query.first.return_value = sale_to_delete
    db.query.return_value.filter.return_value = sale_query

    # Remaining harvests count is 1
    db.query.side_effect = None
    crop_query = MagicMock()
    crop_query.join.return_value.filter.return_value.first.return_value = crop

    def custom_query(entity):
        q = MagicMock()
        if entity is CropCycle:
            return crop_query
        elif entity is CropSale:
            q.filter.return_value.first.return_value = sale_to_delete
            return q
        elif entity is Harvest:
            q.filter.return_value.count.return_value = 1
            return q
        return q

    db.query.side_effect = custom_query

    delete_crop_sale(crop.id, sale_to_delete.id, user=user, db=db)
    # Remaining is now 50 -> must revert from SOLD to HARVESTED
    assert crop.status == CropCycleStatus.HARVESTED


def test_delete_crop_harvest_when_no_sales():
    """Verify deleting a harvest when no other harvests exist resets crop status to ACTIVE."""
    user = User(id=uuid4(), email="farmer@test.com")
    crop = CropCycle(
        id=uuid4(),
        farm_id=uuid4(),
        crop_name="Wheat",
        season=Season.RABI,
        year=2026,
        sowing_date=date(2026, 11, 1),
        status=CropCycleStatus.HARVESTED,
    )

    harvest_to_delete = Harvest(
        id=uuid4(),
        crop_cycle_id=crop.id,
        yield_quantity=50.0,
        yield_unit="quintal",
        harvest_date=date(2026, 4, 1),
    )

    db = MagicMock()
    crop_query = MagicMock()
    crop_query.join.return_value.filter.return_value.first.return_value = crop

    def custom_query(entity):
        q = MagicMock()
        if entity is CropCycle:
            return crop_query
        elif entity is Harvest:
            q.filter.return_value.first.return_value = harvest_to_delete
            # Count of remaining harvests is 0
            q.filter.return_value.count.return_value = 0
            return q
        return q

    db.query.side_effect = custom_query

    delete_harvest(crop.id, harvest_to_delete.id, user=user, db=db)
    db.delete.assert_called_with(harvest_to_delete)
    assert crop.status == CropCycleStatus.ACTIVE
