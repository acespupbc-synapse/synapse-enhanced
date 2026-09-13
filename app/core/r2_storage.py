"""
app/core/r2_storage.py — Cloudflare R2 media storage via boto3 (S3-compatible API)

All photos and signatures are stored as private objects.
Access is via presigned URLs with a configurable expiry.
"""
import base64
import io
import re
import uuid
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

# Cloudflare R2 endpoint (S3-compatible)
R2_ENDPOINT = f"https://{settings.cf_account_id}.r2.cloudflarestorage.com"

# Presigned URL expiry (seconds) — 1 hour
PRESIGNED_EXPIRY = 3600


def _get_client():
    """Create a boto3 S3 client pointed at Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=settings.cf_r2_access_key_id,
        aws_secret_access_key=settings.cf_r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def decode_data_url(data_url: str) -> tuple[bytes, str]:
    """
    Decode a base64 DataURL to raw bytes and content-type.
    e.g. "data:image/jpeg;base64,/9j/4AAQ..."
    Returns (binary_data, content_type)
    """
    match = re.match(r"data:(?P<ct>[^;]+);base64,(?P<data>.+)", data_url, re.DOTALL)
    if not match:
        raise ValueError("Invalid DataURL format.")
    content_type = match.group("ct")
    raw = base64.b64decode(match.group("data"))
    return raw, content_type


def upload_media(
    data_url: str,
    student_id: str,
    media_type: str,  # "photo" or "signature"
) -> str:
    """
    Upload a base64 DataURL to Cloudflare R2.

    Returns the R2 object key (not a URL — use get_presigned_url() to get readable URL).
    """
    raw_bytes, content_type = decode_data_url(data_url)

    # Force JPEG content-type for safety
    if content_type not in ("image/jpeg", "image/jpg"):
        content_type = "image/jpeg"

    object_key = f"students/{student_id}/{media_type}.jpg"
    client = _get_client()

    client.put_object(
        Bucket=settings.cf_r2_bucket_name,
        Key=object_key,
        Body=raw_bytes,
        ContentType=content_type,
    )
    return object_key


def delete_media(object_key: str) -> None:
    """Delete an object from R2 by its key."""
    try:
        client = _get_client()
        client.delete_object(Bucket=settings.cf_r2_bucket_name, Key=object_key)
    except ClientError:
        pass  # Ignore missing object errors


def get_presigned_url(object_key: str, expiry: int = PRESIGNED_EXPIRY) -> Optional[str]:
    """
    Generate a presigned GET URL for a private R2 object.
    Returns None if the object_key is empty/None.
    """
    if not object_key:
        return None
    try:
        client = _get_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.cf_r2_bucket_name, "Key": object_key},
            ExpiresIn=expiry,
        )
        return url
    except Exception as exc:
        print(f"[WARN] Failed to generate presigned URL for {object_key}: {exc}")
        return None


def validate_image_dimensions(
    data_url: str,
    required_width: int,
    required_height: int,
    max_bytes: int,
) -> tuple[bool, str]:
    """
    Validate image dimensions and file size from a DataURL using Pillow.
    Returns (is_valid, error_message).
    """
    try:
        from PIL import Image

        raw_bytes, _ = decode_data_url(data_url)

        if len(raw_bytes) > max_bytes:
            mb = max_bytes / (1024 * 1024)
            return False, f"Image exceeds maximum size of {mb:.0f} MB."

        img = Image.open(io.BytesIO(raw_bytes))
        w, h = img.size

        if w != required_width or h != required_height:
            return (
                False,
                f"Image must be exactly {required_width}×{required_height} px. Got {w}×{h} px.",
            )

        return True, ""
    except Exception as exc:
        return False, f"Image validation failed: {str(exc)}"
