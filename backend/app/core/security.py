"""
Neon Auth (Managed Better Auth) JWT verification.

Neon Auth issues RS256-signed JWTs. We verify them by fetching the
public signing keys from the JWKS endpoint that Neon publishes.
The PyJWKClient handles key caching and rotation automatically.

This module replaces the earlier self-hosted HS256 JWT + bcrypt setup.
Passwords are no longer managed by this app — Neon Auth handles
registration, login, and password hashing externally.

NEVER trust any user/farm/crop id supplied by the client without also
checking ownership in the service layer — this module only answers
"who is making this request", never "what are they allowed to touch".
"""
import logging
from typing import Optional
from uuid import UUID

import jwt as pyjwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User

logger = logging.getLogger("annapoorna.security")
settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)

# --- JWKS client (caches keys, handles rotation) ---
jwks_client = pyjwt.PyJWKClient(settings.NEON_AUTH_JWKS_URL)


# --- Token verification / current-user dependency ---

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolves the request's Bearer token (issued by Neon Auth) to a local
    User row. Raises 401 if missing, expired, invalid, or if the user
    it refers to no longer exists in the local database.

    On first login the user may not have a local row yet. In that case
    we auto-provision one from the JWT claims (sub, email, name).
    """
    if settings.DEV_AUTH_BYPASS:
        user = db.query(User).filter(User.email == "dev@example.com").first()
        if not user:
            user = User(
                email="dev@example.com",
                full_name="Dev User",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authentication token.")

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(credentials.credentials)
        payload = pyjwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["EdDSA", "RS256"],
            options={"verify_aud": False},
        )
    except pyjwt.PyJWTError as exc:
        logger.warning("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=401, detail="Invalid or expired authentication token."
        ) from exc

    # Neon Auth / Better Auth puts the user id in "sub"
    neon_user_id = payload.get("sub")
    if not neon_user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

    email = payload.get("email", "")
    name = payload.get("name", "")

    # Look up by neon_auth_id first, then fall back to email
    user = db.query(User).filter(User.neon_auth_id == neon_user_id).first()

    if not user and email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link existing email-based user to their Neon Auth id
            user.neon_auth_id = neon_user_id
            db.commit()

    if not user:
        # Auto-provision a local user row on first authenticated request
        user = User(
            neon_auth_id=neon_user_id,
            email=email,
            full_name=name or None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Resolves Bearer token to User if present, returns None if unauthenticated."""
    if credentials is None and not settings.DEV_AUTH_BYPASS:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None

