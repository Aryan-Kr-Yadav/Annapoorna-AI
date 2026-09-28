"""
Auth router — minimal, because Neon Auth (Managed Better Auth) handles
registration, login, sessions, and password hashing externally.

The only thing left here is a /me-style endpoint that the frontend can
call after Neon Auth login to confirm the backend recognizes the token.
The actual user provisioning happens in app/core/security.py's
get_current_user when it sees a valid Neon Auth JWT for the first time.
"""
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/verify", response_model=Envelope[UserOut])
def verify_token(user: User = Depends(get_current_user)):
    """
    Frontend calls this after Neon Auth login to confirm the backend
    can verify the token and has a local user record.
    """
    return Envelope(data=UserOut.model_validate(user))
