from datetime import date
from io import BytesIO
from unittest.mock import MagicMock
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.core.security import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import CropCycle
from app.models.soil import SoilTest
from app.models.irrigation import IrrigationLog
from app.models.task import CropTask, TaskStatus
from app.ai.groq_client import _has_image_content


def test_api_endpoints_workflow():
    test_user_id = uuid4()
    test_user = User(
        id=test_user_id,
        email="test_user@annapoorna.ai",
        full_name="Farmer Radha",
        preferred_language="hi",
        preferences={"theme": "dark", "ui_language": "hi"}
    )

    # Override get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_user

    client = TestClient(app)

    # 1. Test image upload endpoint (JPEG optimization)
    img = Image.new("RGB", (200, 200), color=(100, 150, 200))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    image_bytes = buf.getvalue()

    upload_resp = client.post(
        "/api/v1/uploads/image",
        files={"image": ("leaf.jpg", image_bytes, "image/jpeg")}
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    assert "data" in upload_data
    assert "url" in upload_data["data"]
    assert upload_data["data"]["url"].startswith("data:image/jpeg;base64,")

    # 2. Test Invalid Image Upload validation
    bad_resp = client.post(
        "/api/v1/uploads/image",
        files={"file": ("text.txt", b"not an image", "text/plain")}
    )
    assert bad_resp.status_code == 400

    # 3. Test Health endpoint
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"

    # Clean up override
    app.dependency_overrides.pop(get_current_user, None)


def test_soil_and_irrigation_endpoints_require_ownership():
    test_user = User(id=uuid4(), email="owner@farm.com", full_name="Owner")
    app.dependency_overrides[get_current_user] = lambda: test_user

    # Mock DB that returns None for unowned resources
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    mock_db.query.return_value.join.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: mock_db

    client = TestClient(app)
    unowned_farm_id = uuid4()
    unowned_crop_id = uuid4()

    # Soil tests on unowned farm -> 404
    resp = client.get(f"/api/v1/farms/{unowned_farm_id}/soil-tests")
    assert resp.status_code == 404

    # Delete unowned soil test -> 404
    resp = client.delete(f"/api/v1/soil-tests/{uuid4()}")
    assert resp.status_code == 404

    # Irrigation on unowned crop -> 404
    resp = client.get(f"/api/v1/crops/{unowned_crop_id}/irrigation")
    assert resp.status_code == 404

    # Delete unowned irrigation log -> 404
    resp = client.delete(f"/api/v1/crops/{unowned_crop_id}/irrigation/{uuid4()}")
    assert resp.status_code == 404

    # Toggle unowned task -> 404
    resp = client.put(f"/api/v1/tasks/{uuid4()}", json={"is_completed": True})
    assert resp.status_code == 404

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_db, None)


def test_groq_vision_routing_helper():
    text_message = {"role": "user", "content": "How do I water my wheat?"}
    assert _has_image_content([text_message]) is False

    multimodal_message = {
        "role": "user",
        "content": [
            {"type": "text", "text": "What disease is on this leaf?"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,12345"}}
        ]
    }
    assert _has_image_content([multimodal_message]) is True
    assert _has_image_content([text_message, multimodal_message]) is True
