import base64
import io
import logging
from PIL import Image

logger = logging.getLogger("annapoorna.image_utils")


def optimize_image(
    contents: bytes,
    max_dimension: int = 1024,
    min_dimension: int = 32,
    quality: int = 85,
) -> tuple[bytes, str]:
    """
    Validates, resizes, and optimizes image bytes for AI multimodal processing.
    Ensures dimensions are at least min_dimension (to prevent Groq 400 errors)
    and at most max_dimension (to prevent payload/rate-limit explosions).
    Returns (optimized_bytes, mime_type).
    """
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
        # Re-open because verify() closes the file
        img = Image.open(io.BytesIO(contents))
    except Exception as exc:
        logger.warning("Invalid or corrupt image uploaded: %s", exc)
        raise ValueError("Invalid or corrupted image file. Please upload a valid JPG, PNG, or WebP photo.") from exc

    w, h = img.size
    # Enforce minimum dimension
    if w < min_dimension or h < min_dimension:
        new_w = max(w, min_dimension)
        new_h = max(h, min_dimension)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Downsample if larger than max_dimension
    if img.size[0] > max_dimension or img.size[1] > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

    # Convert modes to standard RGB
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=quality, optimize=True)
    optimized = out.getvalue()
    return optimized, "image/jpeg"


def image_bytes_to_data_url(contents: bytes) -> str:
    optimized, mime = optimize_image(contents)
    b64 = base64.b64encode(optimized).decode("utf-8")
    return f"data:{mime};base64,{b64}"
