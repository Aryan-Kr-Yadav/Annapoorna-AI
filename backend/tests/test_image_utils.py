import io
from PIL import Image
import pytest
from app.core.image_utils import optimize_image, image_bytes_to_data_url


def test_optimize_small_image():
    # Image smaller than 32x32 should be enlarged to 32x32 to meet Groq minimum
    img = Image.new("RGB", (10, 10), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    optimized, mime = optimize_image(buf.getvalue(), min_dimension=32)

    result_img = Image.open(io.BytesIO(optimized))
    w, h = result_img.size
    assert w >= 32
    assert h >= 32
    assert mime == "image/jpeg"


def test_optimize_large_image():
    # Large 2000x2000 image should be downscaled to max_dimension 1024
    img = Image.new("RGB", (2000, 1500), color="green")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    optimized, mime = optimize_image(buf.getvalue(), max_dimension=1024)

    result_img = Image.open(io.BytesIO(optimized))
    w, h = result_img.size
    assert w <= 1024
    assert h <= 1024


def test_invalid_image_bytes():
    with pytest.raises(ValueError, match="Invalid or corrupted image"):
        optimize_image(b"not-an-image-payload")


def test_image_bytes_to_data_url():
    img = Image.new("RGB", (50, 50), color="yellow")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    data_url = image_bytes_to_data_url(buf.getvalue())
    assert data_url.startswith("data:image/jpeg;base64,")
