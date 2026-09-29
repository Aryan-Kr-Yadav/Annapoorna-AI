"""
Groq tool/function definitions and their SAFE, ownership-checked
Python implementations.

CRITICAL INVARIANT: every tool function here takes `db`, `user` (the
authenticated local User row) and tool-specific args, and MUST resolve
any farm_id/crop_cycle_id through app.services.ownership before
touching data. Groq is given the JSON schema below and picks which
tools to call; it never gets raw SQL or unrestricted DB access.
"""
from datetime import date, timedelta
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.crop import CropCycle
from app.models.expense import Expense
from app.models.farm import Farm
from app.models.irrigation import IrrigationLog
from app.models.soil import SoilTest
from app.models.task import CropTask, TaskStatus, TaskType
from app.models.diagnosis import Diagnosis
from app.models.user import User
from app.services import analytics_service, market_service, scheme_service
from app.services.advisory_service import generate_farm_weather_alerts
from app.services.lifecycle_engine import calculate_lifecycle
from app.services.ownership import get_owned_crop_cycle, get_owned_farm
from app.services.scheme_matching_service import SchemeMatchingService, get_farmer_context
from app.services.weather_service import get_current_and_forecast

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_weather_advisory",
            "description": "Get real-time weather from Open-Meteo and Annapoorna agronomic rules advisory (irrigation delay if rain expected, spraying safety, heat stress, disease risk) for a farm.",
            "parameters": {
                "type": "object",
                "properties": {"farm_id": {"type": "string", "description": "UUID of the farm"}},
                "required": ["farm_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_farm_details",
            "description": "Get details about one of the user's farms (location, size, soil type, irrigation type).",
            "parameters": {
                "type": "object",
                "properties": {"farm_id": {"type": "string", "description": "UUID of the farm"}},
                "required": ["farm_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_crop",
            "description": "Get the currently active crop cycle for a given farm.",
            "parameters": {
                "type": "object",
                "properties": {"farm_id": {"type": "string"}},
                "required": ["farm_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_crop_stage",
            "description": "Get the current lifecycle stage and day-count for a crop cycle.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_irrigation_history",
            "description": "Get recent irrigation log entries for a crop cycle.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}, "limit": {"type": "integer"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_soil_health",
            "description": "Get the most recent soil test results and their ratings for a crop cycle.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_crop_health_history",
            "description": "Get recent Crop Doctor diagnosis/inspection history for a crop cycle.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}, "limit": {"type": "integer"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_today_tasks",
            "description": "Get tasks scheduled for today for a crop cycle.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_tasks",
            "description": "Get pending tasks scheduled in the next N days for a crop cycle.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}, "days": {"type": "integer"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_expense_summary",
            "description": "Get total and category-wise expenses for a crop cycle this season.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_profit_summary",
            "description": "Get expenses, revenue, profit and ROI for a crop cycle.",
            "parameters": {
                "type": "object",
                "properties": {"crop_cycle_id": {"type": "string"}},
                "required": ["crop_cycle_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_market_prices",
            "description": "Get recent cached market/mandi prices for a crop in a state.",
            "parameters": {
                "type": "object",
                "properties": {"crop": {"type": "string"}, "state": {"type": "string"}},
                "required": ["crop", "state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommended_schemes",
            "description": "Get verified government schemes recommended for the farmer based on their stored farm profile (state, district, farm size, crops, irrigation, soil). Deterministically evaluated against verified government data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Optional category filter: Income Support, Crop Insurance, Credit / Loans, Irrigation, Equipment, Seeds, Soil, Organic Farming, Solar / Energy",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_schemes",
            "description": "Search verified government schemes by state, category, crop, or search query.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {"type": "string"},
                    "category": {"type": "string"},
                    "crop": {"type": "string"},
                    "query": {"type": "string"},
                },
            },
        },
    },
]


def _serialize_task(t: CropTask) -> dict:
    return {
        "title": t.title,
        "type": t.task_type.value,
        "scheduled_date": t.scheduled_date.isoformat(),
        "status": t.status.value,
        "priority": t.priority.value,
    }


def _parse_uuid(val: Any) -> Optional[UUID]:
    if not val:
        return None
    try:
        return UUID(str(val).strip())
    except (ValueError, TypeError):
        return None


async def execute_tool(db: Session, user: User, tool_name: str, args: dict) -> dict:
    """Dispatches a tool call by name, enforcing ownership on every path."""

    if tool_name == "get_weather_advisory":
        farm_id = _parse_uuid(args.get("farm_id"))
        if not farm_id:
            return {"error": "Invalid or missing farm_id. Please ask the user for a valid farm ID."}
        farm = get_owned_farm(db, farm_id, user.id)
        weather = await get_current_and_forecast(farm.latitude, farm.longitude, farm.district, farm.state)

        crop = (
            db.query(CropCycle)
            .filter(CropCycle.farm_id == farm.id, CropCycle.status == "active")
            .order_by(CropCycle.sowing_date.desc())
            .first()
        )
        last_irrigation = None
        has_irrigation_tomorrow = False
        if crop:
            last_log = (
                db.query(IrrigationLog)
                .filter(IrrigationLog.crop_cycle_id == crop.id)
                .order_by(IrrigationLog.date.desc())
                .first()
            )
            last_irrigation = last_log.date if last_log else None
            tomorrow_date = date.today() + timedelta(days=1)
            has_irrigation_tomorrow = (
                db.query(CropTask)
                .filter(
                    CropTask.crop_cycle_id == crop.id,
                    CropTask.scheduled_date == tomorrow_date,
                    CropTask.task_type == TaskType.IRRIGATION,
                    CropTask.status == TaskStatus.PENDING,
                )
                .first()
                is not None
            )

        alerts = generate_farm_weather_alerts(
            weather=weather,
            last_irrigation_date=last_irrigation,
            has_scheduled_irrigation_tomorrow=has_irrigation_tomorrow,
        )

        return {
            "farm_name": farm.name,
            "location": f"{farm.district}, {farm.state}",
            "weather_available": weather.get("available", False),
            "current_weather": weather.get("current"),
            "daily_forecast": weather.get("daily_forecast", [])[:3],
            "active_advisory_alerts": alerts,
        }

    if tool_name == "get_farm_details":
        farm_id = _parse_uuid(args.get("farm_id"))
        if not farm_id:
            return {"error": "Invalid or missing farm_id. Please ask the user for a valid farm ID."}
        farm = get_owned_farm(db, farm_id, user.id)
        return {
            "name": farm.name,
            "state": farm.state,
            "district": farm.district,
            "area": farm.area,
            "area_unit": farm.area_unit.value,
            "soil_type": farm.soil_type,
            "irrigation_type": farm.irrigation_type.value,
        }

    if tool_name == "get_active_crop":
        farm_id = _parse_uuid(args.get("farm_id"))
        if not farm_id:
            return {"error": "Invalid or missing farm_id. Please ask the user for a valid farm ID."}
        farm = get_owned_farm(db, farm_id, user.id)
        crop = (
            db.query(CropCycle)
            .filter(CropCycle.farm_id == farm.id, CropCycle.status == "active")
            .order_by(CropCycle.sowing_date.desc())
            .first()
        )
        if not crop:
            return {"active_crop": None, "message": "No active crop cycle found for this farm."}
        return {
            "crop_cycle_id": str(crop.id),
            "crop_name": crop.crop_name,
            "variety": crop.variety,
            "season": crop.season.value,
            "year": crop.year,
            "sowing_date": crop.sowing_date.isoformat(),
        }

    if tool_name == "get_crop_stage":
        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            return {"error": "Invalid or missing crop_cycle_id. Please ask the user for a crop cycle ID."}
        crop = get_owned_crop_cycle(db, crop_id, user.id)
        lifecycle = calculate_lifecycle(crop.crop_name, crop.sowing_date)
        return lifecycle.model_dump()

    if tool_name == "get_irrigation_history":
        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            return {"error": "Invalid or missing crop_cycle_id. Please ask the user for a crop cycle ID."}
        crop = get_owned_crop_cycle(db, crop_id, user.id)
        limit = args.get("limit", 5)
        logs = (
            db.query(IrrigationLog)
            .filter(IrrigationLog.crop_cycle_id == crop.id)
            .order_by(IrrigationLog.date.desc())
            .limit(limit)
            .all()
        )
        return {
            "logs": [
                {"date": l.date.isoformat(), "method": l.method.value, "notes": l.notes} for l in logs
            ]
        }

    if tool_name == "get_soil_health":
        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            return {"error": "Invalid or missing crop_cycle_id. Please ask the user for a crop cycle ID."}
        crop = get_owned_crop_cycle(db, crop_id, user.id)
        from app.data.soil_reference_ranges import rate_ph, rate_nitrogen, rate_phosphorus, rate_potassium

        test = (
            db.query(SoilTest)
            .filter(SoilTest.crop_cycle_id == crop.id)
            .order_by(SoilTest.test_date.desc())
            .first()
        )
        if not test:
            return {"soil_test": None, "message": "No soil test has been recorded for this crop cycle yet."}
        return {
            "test_date": test.test_date.isoformat(),
            "ph": {"value": test.ph, "rating": rate_ph(test.ph)},
            "nitrogen": {"value": test.nitrogen, "rating": rate_nitrogen(test.nitrogen)},
            "phosphorus": {"value": test.phosphorus, "rating": rate_phosphorus(test.phosphorus)},
            "potassium": {"value": test.potassium, "rating": rate_potassium(test.potassium)},
        }

    if tool_name == "get_crop_health_history":
        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            # Fallback to user's first active crop cycle if not explicitly passed
            active_cycle = db.query(CropCycle).filter(CropCycle.user_id == user.id, CropCycle.status == CropCycleStatus.ACTIVE).first()
            if active_cycle:
                crop_id = active_cycle.id
            else:
                return {"error": "Invalid or missing crop_cycle_id and no active crop was found."}

        crop = get_owned_crop_cycle(db, crop_id, user.id)
        limit = args.get("limit", 5)
        diagnoses = (
            db.query(Diagnosis)
            .filter(Diagnosis.crop_cycle_id == crop.id)
            .order_by(Diagnosis.created_at.desc())
            .limit(limit)
            .all()
        )

        history_items = []
        for d in diagnoses:
            details = d.analysis_details or {}
            history_items.append({
                "date": d.created_at.date().isoformat(),
                "possible_condition": d.possible_condition or "No issue identified",
                "severity": d.severity.value,
                "confidence": d.confidence_percentage if d.confidence_percentage is not None else "unavailable",
                "symptoms_reported": d.symptoms_reported or "Not specified",
                "observations": details.get("observations") or [],
                "immediate_actions": details.get("immediate_actions") or [],
                "treatment_options": details.get("treatment_options") or [],
                "monitoring": details.get("monitoring") or "Check symptoms in 2-3 days",
            })

        # Calculate severity progression trend if 2 or more inspections
        progression_trend = "Single inspection recorded."
        if len(diagnoses) >= 2:
            latest_sev = diagnoses[0].severity.value
            prev_sev = diagnoses[1].severity.value
            sev_rank = {"low": 1, "medium": 2, "high": 3, "unknown": 0}
            if sev_rank.get(latest_sev, 0) < sev_rank.get(prev_sev, 0):
                progression_trend = f"Recorded severity improved from {prev_sev} ({diagnoses[1].created_at.date().isoformat()}) to {latest_sev} ({diagnoses[0].created_at.date().isoformat()})."
            elif sev_rank.get(latest_sev, 0) > sev_rank.get(prev_sev, 0):
                progression_trend = f"Recorded severity worsened from {prev_sev} ({diagnoses[1].created_at.date().isoformat()}) to {latest_sev} ({diagnoses[0].created_at.date().isoformat()})."
            else:
                progression_trend = f"Recorded severity remained {latest_sev} between {diagnoses[1].created_at.date().isoformat()} and {diagnoses[0].created_at.date().isoformat()}."

        return {
            "crop_name": crop.crop_name,
            "season": f"{crop.season.value} {crop.year}",
            "total_inspections": len(diagnoses),
            "progression_trend": progression_trend,
            "history": history_items,
        }

    if tool_name == "get_today_tasks":
        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            return {"error": "Invalid or missing crop_cycle_id. Please ask the user for a crop cycle ID."}
        crop = get_owned_crop_cycle(db, crop_id, user.id)
        tasks = (
            db.query(CropTask)
            .filter(
                CropTask.crop_cycle_id == crop.id,
                CropTask.scheduled_date == date.today(),
                CropTask.status == TaskStatus.PENDING,
            )
            .all()
        )
        return {"tasks": [_serialize_task(t) for t in tasks]}

    if tool_name == "get_upcoming_tasks":
        from datetime import timedelta

        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            return {"error": "Invalid or missing crop_cycle_id. Please ask the user for a crop cycle ID."}
        crop = get_owned_crop_cycle(db, crop_id, user.id)
        days = args.get("days", 7)
        tasks = (
            db.query(CropTask)
            .filter(
                CropTask.crop_cycle_id == crop.id,
                CropTask.scheduled_date >= date.today(),
                CropTask.scheduled_date <= date.today() + timedelta(days=days),
                CropTask.status == TaskStatus.PENDING,
            )
            .order_by(CropTask.scheduled_date.asc())
            .all()
        )
        return {"tasks": [_serialize_task(t) for t in tasks]}

    if tool_name == "get_expense_summary":
        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            return {"error": "Invalid or missing crop_cycle_id. Please ask the user for a crop cycle ID."}
        crop = get_owned_crop_cycle(db, crop_id, user.id)
        return analytics_service.expense_summary(db, crop.id)

    if tool_name == "get_profit_summary":
        crop_id = _parse_uuid(args.get("crop_cycle_id"))
        if not crop_id:
            return {"error": "Invalid or missing crop_cycle_id. Please ask the user for a crop cycle ID."}
        crop = get_owned_crop_cycle(db, crop_id, user.id)
        return analytics_service.profit_summary(db, crop.id)

    if tool_name == "get_market_prices":
        crop_name = args.get("crop", "")
        state_name = args.get("state", "")
        if not crop_name or not state_name:
            return {"data_available": False, "message": "Both crop name and state are required to check market prices."}
        result = market_service.get_cached_prices(db, crop_name, state_name)
        if not result["data_available"]:
            return {"data_available": False, "message": result["message"]}
        return {
            "data_available": True,
            "points": [
                {
                    "date": p.price_date.isoformat(),
                    "modal_price": float(p.modal_price) if p.modal_price else None,
                    "market": p.market_name,
                }
                for p in result["points"][-10:]
            ],
        }

    if tool_name == "get_recommended_schemes":
        context = get_farmer_context(db, user_id=user.id)
        recs = SchemeMatchingService.get_recommendations(db, context, category=args.get("category"))
        return {
            "status": "success",
            "farmer_context": {
                "state": context.state,
                "farm_size": f"{context.farm_size} {context.area_unit}" if context.farm_size else "Not recorded",
                "crops": context.crops or ["Not recorded"],
            },
            "recommendations": [
                {
                    "name": r.scheme.name,
                    "short_name": r.scheme.short_name,
                    "category": r.scheme.category,
                    "benefits": r.scheme.benefits[:3] if r.scheme.benefits else [],
                    "reasons": r.match.reasons,
                    "missing_information": r.match.missing_information,
                    "official_url": r.scheme.official_url,
                    "source": r.scheme.source or r.scheme.ministry_or_department,
                    "last_verified": str(r.scheme.last_verified) if r.scheme.last_verified else None,
                }
                for r in recs[:5]
            ],
            "disclaimer": (
                "These schemes are potentially relevant based on your profile. "
                "Final eligibility must be verified on the official government portal before applying."
            ),
        }

    if tool_name == "search_schemes":
        from sqlalchemy import or_
        from app.models.scheme import Scheme

        query_str = args.get("query")
        q = db.query(Scheme).filter(Scheme.active_status.is_(True))
        if query_str:
            q = q.filter(
                or_(
                    Scheme.name.ilike(f"%{query_str}%"),
                    Scheme.short_name.ilike(f"%{query_str}%"),
                    Scheme.description.ilike(f"%{query_str}%"),
                    Scheme.category.ilike(f"%{query_str}%"),
                )
            )
        if args.get("state"):
            q = q.filter(
                or_(
                    Scheme.state.is_(None),
                    Scheme.state.ilike(f"%{args.get('state')}%"),
                    Scheme.scheme_type == "central",
                )
            )
        if args.get("category"):
            q = q.filter(Scheme.category.ilike(f"%{args.get('category')}%"))

        schemes = q.limit(5).all()
        return {
            "schemes": [
                {
                    "name": s.name,
                    "short_name": s.short_name,
                    "description": s.description,
                    "category": s.category,
                    "benefits": s.benefits[:3] if s.benefits else [],
                    "official_url": s.official_url,
                    "source": s.source or s.ministry_or_department,
                    "last_verified": str(s.last_verified) if s.last_verified else None,
                }
                for s in schemes
            ],
            "disclaimer": "Government scheme details must be verified on the official portal before applying.",
        }

    return {"error": f"Unknown tool: {tool_name}"}
