"""
Generic image upload endpoint used by the chat interface (both the
floating assistant and the full assistant page) so a user can attach a
photo to a message. When permanent storage (Cloudinary/S3) is not
configured, returns a base64 data URL so the image can still be used
for AI vision analysis.
"""
import base64
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.storage import storage
from app.models.user import User
from app.schemas.common import Envelope

logger = logging.getLogger("annapoorna.uploads")

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


@router.post("/image", response_model=Envelope[dict])
async def upload_image(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_file = image or file
    if target_file is None:
        raise HTTPException(status_code=400, detail="No image file provided.")

    if target_file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, or WebP image.")
    contents = await target_file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image is empty (0 bytes). Please select a valid photo.")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large (max 5MB). Please upload a smaller photo.")

    # Validate and optimize image dimensions and payload size for AI vision processing
    try:
        from app.core.image_utils import optimize_image
        optimized_bytes, mime = optimize_image(contents, max_dimension=1024, min_dimension=32)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.warning("Image optimization failed: %s", exc)
        optimized_bytes, mime = contents, (target_file.content_type or "image/jpeg")

    # Try permanent storage first; fall back to base64 data URL
    try:
        url = storage.upload_image(optimized_bytes, f"chat-{user.id}-{target_file.filename}")
    except RuntimeError:
        # Storage not configured — return a base64 data URL so AI vision still works
        logger.info("Image storage not configured; returning optimized base64 data URL.")
        b64 = base64.b64encode(optimized_bytes).decode("utf-8")
        url = f"data:{mime};base64,{b64}"

    return Envelope(message="Image uploaded.", data={"url": url})
