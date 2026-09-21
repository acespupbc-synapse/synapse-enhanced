"""
app/core/r2_storage.py — Cloudflare R2 media storage via boto3 (S3-compatible API)

All photos and signatures are stored as private objects.
Access is via presigned URLs with a configurable expiry.
"""
import base64
import hashlib
import io
import os
import re
import tempfile
import time
import unicodedata
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
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

_r2_client = None


def _get_client():
    """Get or create a cached boto3 S3 client pointed at Cloudflare R2."""
    global _r2_client
    if _r2_client is None:
        _r2_client = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=settings.cf_r2_access_key_id,
            aws_secret_access_key=settings.cf_r2_secret_access_key,
            config=Config(
                signature_version="s3v4",
                max_pool_connections=50,
                connect_timeout=5,
                read_timeout=15,
                retries={"max_attempts": 2, "mode": "standard"},
            ),
            region_name="auto",
        )
    return _r2_client


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


# Phase 1.4 / B7: Strict allowlist filename sanitizer
# Uses unicode normalization to handle accented chars; keeps only ASCII letters,
# digits, spaces, commas, periods, and hyphens. Prevents path traversal.
_FILENAME_ALLOWED = re.compile(r"[^A-Za-z0-9 ,\.\-]")

def _safe_filename(raw: str) -> str:
    """Normalize and sanitize a filename to a safe ASCII subset."""
    # Normalize unicode to closest ASCII equivalent (e.g. É -> E)
    normalized = unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")
    # Keep only the allowed character set
    clean = _FILENAME_ALLOWED.sub("", normalized).strip()
    # Strip any leading dots or slashes that could cause path traversal
    clean = clean.lstrip("./").replace("..", "")
    return clean or "unnamed"


def upload_media(
    data_url: str,
    student_id: str,
    media_type: str,  # "photo" or "signature"
    filename: Optional[str] = None,
) -> str:
    """
    Upload a base64 DataURL to Cloudflare R2.

    Object key format:
      With filename:  '{media_type}s/{clean_name}__{student_id[:8]}.jpg'
      Without:        'students/{student_id}/{media_type}.jpg'

    Using the student_id suffix (B7) prevents key collisions when two students
    share the same name (e.g. 'REYES, JUAN A.').

    Returns the R2 object key (not a URL — use get_presigned_url() to get a URL).
    """
    raw_bytes, content_type = decode_data_url(data_url)

    # Force JPEG content-type for safety
    if content_type not in ("image/jpeg", "image/jpg"):
        content_type = "image/jpeg"

    # Phase 1.4: Use _safe_filename (strict allowlist) instead of the old blocklist.
    # B7: Append first 8 chars of student_id to guarantee uniqueness per student.
    if filename:
        clean_name = _safe_filename(filename)
        sid_suffix = str(student_id)[:8] if student_id else str(uuid.uuid4())[:8]
        object_key = f"{media_type}s/{clean_name}__{sid_suffix}.jpg"
    else:
        object_key = f"students/{student_id}/{media_type}.jpg"

    # Assert key stays within the expected prefix (belt-and-suspenders)
    expected_prefix = f"{media_type}s/" if filename else f"students/"
    if not object_key.startswith(expected_prefix):
        raise ValueError(f"Constructed R2 key '{object_key}' is outside expected prefix.")

    client = _get_client()
    client.put_object(
        Bucket=settings.cf_r2_bucket_name,
        Key=object_key,
        Body=raw_bytes,
        ContentType=content_type,
    )
    bust_bucket_metrics_cache()
    return object_key


def delete_media(object_key: str) -> None:
    """Delete an object from R2 by its key."""
    try:
        client = _get_client()
        client.delete_object(Bucket=settings.cf_r2_bucket_name, Key=object_key)
        bust_bucket_metrics_cache()
    except ClientError:
        pass  # Ignore missing object errors


def delete_media_batch(object_keys: list[str]) -> None:
    """Phase 3.7: Delete multiple objects from R2 in a single batch request (chunks of up to 1000)."""
    valid_keys = [k for k in object_keys if k]
    if not valid_keys:
        return
    try:
        client = _get_client()
        for i in range(0, len(valid_keys), 1000):
            chunk = valid_keys[i : i + 1000]
            client.delete_objects(
                Bucket=settings.cf_r2_bucket_name,
                Delete={"Objects": [{"Key": k} for k in chunk], "Quiet": True},
            )
        bust_bucket_metrics_cache()
    except Exception as e:
        print(f"[WARN] Failed to batch delete R2 media: {e}")


_presigned_url_cache: dict[str, tuple[str, float]] = {}
# Phase 3.3: Cap the cache to prevent unbounded memory growth
_MAX_PRESIGNED_CACHE_SIZE = 1000


def get_presigned_url(object_key: str, expiry: int = PRESIGNED_EXPIRY) -> Optional[str]:
    """
    Generate a presigned GET URL for a private R2 object with in-memory caching.
    Cache is capped at 1000 entries; oldest entries are evicted when full.
    Returns None if the object_key is empty/None.
    """
    if not object_key:
        return None
    now = time.time()
    cached = _presigned_url_cache.get(object_key)
    if cached and now < cached[1]:
        return cached[0]

    try:
        client = _get_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.cf_r2_bucket_name, "Key": object_key},
            ExpiresIn=expiry,
        )
        # Phase 3.3: Evict oldest entry if cache is at capacity before inserting
        if len(_presigned_url_cache) >= _MAX_PRESIGNED_CACHE_SIZE:
            oldest_key = next(iter(_presigned_url_cache))
            del _presigned_url_cache[oldest_key]
        _presigned_url_cache[object_key] = (url, now + min(expiry - 300, 1800))
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


# Shared module-level cache for bucket metrics — 300s TTL.
# Both /dashboard and /diagnostics read from this so values are always in sync.
_bucket_metrics_cache: dict = {"data": None, "ts": 0.0}
_BUCKET_METRICS_CACHE_TTL = 300  # seconds


def bust_bucket_metrics_cache() -> None:
    """Invalidate the bucket metrics cache (e.g. after an upload or delete)."""
    _bucket_metrics_cache["ts"] = 0.0


def get_bucket_metrics() -> dict:
    """
    Query Cloudflare R2 bucket for total object count, total bytes, and size in MB.
    Results are cached for 300 seconds — R2 bucket size changes slowly.
    IMPORTANT: This is a blocking function — always call via asyncio.to_thread().
    """
    now = time.time()
    if _bucket_metrics_cache["data"] and (now - _bucket_metrics_cache["ts"] < _BUCKET_METRICS_CACHE_TTL):
        return _bucket_metrics_cache["data"]

    try:
        client = _get_client()
        paginator = client.get_paginator("list_objects_v2")
        total_objects = 0
        total_bytes = 0
        for page in paginator.paginate(Bucket=settings.cf_r2_bucket_name):
            for obj in page.get("Contents", []):
                total_objects += 1
                total_bytes += obj.get("Size", 0)
        size_mb = round(total_bytes / (1024 * 1024), 2)
        result = {
            "total_objects": total_objects,
            "total_bytes": total_bytes,
            "size_mb": size_mb,
        }
    except Exception as exc:
        print(f"[WARN] Failed to get R2 bucket metrics: {exc}")
        result = {
            "total_objects": 0,
            "total_bytes": 0,
            "size_mb": 0.0,
            "error": str(exc),
        }

    _bucket_metrics_cache["data"] = result
    _bucket_metrics_cache["ts"] = now
    return result


# ── Persistent Local Media Cache for Fast Exports ───────────────────────────
MEDIA_CACHE_DIR = os.path.join(tempfile.gettempdir(), "synapse_r2_media_cache")
os.makedirs(MEDIA_CACHE_DIR, exist_ok=True)


def invalidate_media_cache(key: str) -> None:
    """Remove a cached media object from local disk if it exists."""
    if not key:
        return
    h = hashlib.sha256(key.encode("utf-8")).hexdigest()
    cache_path = os.path.join(MEDIA_CACHE_DIR, f"{h}.bin")
    try:
        if os.path.exists(cache_path):
            os.unlink(cache_path)
    except Exception:
        pass


def fetch_media_batch(keys: list[str]) -> dict[str, bytes]:
    """
    Fetch a list of R2 object keys with a local persistent disk cache.
    - If an object is already on local disk, loads directly from disk (instant: <1ms).
    - If not in disk cache, downloads in parallel using up to 30 workers with connection pooling,
      and writes to disk cache for all subsequent exports.
    """
    results: dict[str, bytes] = {}
    missing_items: list[tuple[str, str]] = []

    # 1. Check local disk cache first
    for key in set(keys):
        if not key:
            continue
        h = hashlib.sha256(key.encode("utf-8")).hexdigest()
        cache_path = os.path.join(MEDIA_CACHE_DIR, f"{h}.bin")
        if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
            try:
                with open(cache_path, "rb") as f:
                    results[key] = f.read()
                continue
            except Exception:
                pass
        missing_items.append((key, cache_path))

    # 2. Concurrently fetch any missing keys from Cloudflare R2
    if missing_items:
        r2_client = _get_client()
        bucket = settings.cf_r2_bucket_name

        def _fetch_and_cache(item: tuple[str, str]) -> tuple[str, bytes]:
            k, c_path = item
            obj = r2_client.get_object(Bucket=bucket, Key=k)
            data = obj["Body"].read()
            # Atomically save to disk cache
            try:
                tmp = f"{c_path}.tmp.{os.getpid()}_{uuid.uuid4().hex[:8]}"
                with open(tmp, "wb") as f:
                    f.write(data)
                os.replace(tmp, c_path)
            except Exception:
                pass
            return k, data

        max_workers = min(30, max(5, len(missing_items)))
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = [pool.submit(_fetch_and_cache, item) for item in missing_items]
            for fut in as_completed(futures):
                try:
                    k, data = fut.result()
                    results[k] = data
                except Exception as exc:
                    print(f"[WARN] Failed to download {exc}")

    return results

