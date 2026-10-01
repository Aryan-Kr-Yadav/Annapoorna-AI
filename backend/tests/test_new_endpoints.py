from datetime import date
from uuid import uuid4
from app.models.crop import CropCycle, Season, CropCycleStatus
from app.models.farm import Farm, AreaUnit, IrrigationType
from app.models.soil import SoilTest
from app.models.irrigation import IrrigationLog, IrrigationMethod
from app.models.task import CropTask, TaskType, TaskPriority, TaskStatus
from app.models.user import User
from app.data.soil_reference_ranges import (
    rate_ph,
    rate_nitrogen,
    rate_phosphorus,
    rate_potassium,
    rate_organic_carbon,
)


def test_soil_and_irrigation_models_initialization():
    user_id = uuid4()
    farm_id = uuid4()
    crop_id = uuid4()

    crop = CropCycle(
        id=crop_id,
        farm_id=farm_id,
        crop_name="Wheat",
        season=Season.RABI,
        year=2026,
        sowing_date=date(2026, 11, 1),
        status=CropCycleStatus.ACTIVE,
    )
    assert crop.crop_name == "Wheat"
    assert crop.season == Season.RABI

    # Soil test
    soil = SoilTest(
        crop_cycle_id=crop.id,
        test_date=date(2026, 10, 15),
        ph=6.8,
        nitrogen=240.0,
        phosphorus=18.0,
        potassium=160.0,
        organic_carbon=0.65,
        notes="Pre-sowing soil fertility test",
    )
    assert soil.ph == 6.8
    assert rate_ph(soil.ph) == "Normal"
    assert rate_nitrogen(soil.nitrogen) == "Low"
    assert rate_phosphorus(soil.phosphorus) == "Normal"
    assert rate_potassium(soil.potassium) == "Normal"
    assert rate_organic_carbon(soil.organic_carbon) == "Normal"

    # Irrigation log
    irrigation = IrrigationLog(
        crop_cycle_id=crop.id,
        date=date(2026, 11, 10),
        method=IrrigationMethod.DRIP,
        duration_minutes=45,
        water_amount_liters=2500.0,
        notes="First post-sowing irrigation",
    )
    assert irrigation.method == IrrigationMethod.DRIP
    assert irrigation.duration_minutes == 45
    assert irrigation.water_amount_liters == 2500.0

    # Task
    task = CropTask(
        crop_cycle_id=crop.id,
        title="Check crown root initiation",
        task_type=TaskType.INSPECTION,
        scheduled_date=date(2026, 11, 21),
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
    )
    assert task.title == "Check crown root initiation"
    assert task.task_type == TaskType.INSPECTION
    assert task.status == TaskStatus.PENDING
