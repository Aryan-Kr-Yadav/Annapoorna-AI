"""
Image storage abstraction.

The rest of the app only ever calls `storage.upload_image(...)` and
`storage.delete_image(...)`. Swapping Cloudinary for S3 (or anything
else) means writing one new class here — nothing else in the codebase
needs to change.
"""
from abc import ABC, abstractmethod
from typing import Optional

from app.core.config import get_settings

settings = get_settings()


class StorageBackend(ABC):
    @abstractmethod
    def upload_image(self, file_bytes: bytes, filename: str, folder: str = "krishimitra") -> str:
        """Uploads an image, returns a publicly-fetchable URL."""

    @abstractmethod
    def delete_image(self, url: str) -> None:
        """Best-effort delete; should not raise if already gone."""


class CloudinaryBackend(StorageBackend):
    def __init__(self):
        import cloudinary  # local import so this dependency is optional at runtime

        cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
        self._cloudinary = cloudinary

    def upload_image(self, file_bytes: bytes, filename: str, folder: str = "krishimitra") -> str:
        import cloudinary.uploader

        result = cloudinary.uploader.upload(
            file_bytes, folder=folder, public_id=filename, resource_type="image"
        )
        return result["secure_url"]

    def delete_image(self, url: str) -> None:
        import cloudinary.uploader

        try:
            public_id = url.rsplit("/", 1)[-1].rsplit(".", 1)[0]
            cloudinary.uploader.destroy(public_id)
        except Exception:  # noqa: BLE001 — best-effort cleanup
            pass


class S3Backend(StorageBackend):
    def __init__(self):
        import boto3

        self._client = boto3.client(
            "s3",
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self._bucket = settings.S3_BUCKET

    def upload_image(self, file_bytes: bytes, filename: str, folder: str = "krishimitra") -> str:
        key = f"{folder}/{filename}"
        self._client.put_object(Bucket=self._bucket, Key=key, Body=file_bytes, ContentType="image/jpeg")
        return f"https://{self._bucket}.s3.{settings.S3_REGION}.amazonaws.com/{key}"

    def delete_image(self, url: str) -> None:
        try:
            key = url.split(f"{self._bucket}.s3.{settings.S3_REGION}.amazonaws.com/")[-1]
            self._client.delete_object(Bucket=self._bucket, Key=key)
        except Exception:  # noqa: BLE001
            pass


class NullBackend(StorageBackend):
    """Used when no storage provider is configured yet (local dev)."""

    def upload_image(self, file_bytes: bytes, filename: str, folder: str = "krishimitra") -> str:
        raise RuntimeError(
            "Image storage is not configured. Set CLOUDINARY_URL or S3 credentials in the backend .env."
        )

    def delete_image(self, url: str) -> None:
        return None


def get_storage_backend() -> StorageBackend:
    if settings.STORAGE_PROVIDER == "cloudinary" and settings.CLOUDINARY_URL:
        return CloudinaryBackend()
    if settings.STORAGE_PROVIDER == "s3" and settings.S3_BUCKET:
        return S3Backend()
    return NullBackend()


storage = get_storage_backend()
