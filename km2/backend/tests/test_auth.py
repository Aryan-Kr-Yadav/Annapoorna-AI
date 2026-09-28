from unittest.mock import MagicMock
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi import HTTPException

from app.core.config import get_settings
from app.core.security import get_current_user
from app.models.user import User

settings = get_settings()


def test_dev_auth_bypass():
    settings.DEV_AUTH_BYPASS = True
    db = MagicMock()
    # Mock user exists
    mock_user = User(email="dev@example.com", full_name="Dev User")
    db.query().filter().first.return_value = mock_user

    user = get_current_user(credentials=None, db=db)
    assert user.email == "dev@example.com"


def test_missing_credentials_raises_401():
    settings.DEV_AUTH_BYPASS = False
    db = MagicMock()
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=None, db=db)
    assert exc_info.value.status_code == 401
    assert "Missing authentication token" in exc_info.value.detail
