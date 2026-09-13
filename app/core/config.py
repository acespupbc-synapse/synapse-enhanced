"""
app/core/config.py — Pydantic Settings
Loads all configuration from .env file automatically.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase / PostgreSQL
    database_url: str
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Cloudflare R2
    cf_account_id: str
    cf_r2_bucket_name: str
    cf_r2_access_key_id: str
    cf_r2_secret_access_key: str
    cf_r2_public_url: str = ""  # unused for presigned; kept for optional public fallback

    # JWT Auth
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # CORS
    allowed_origins: str = "http://localhost:5173"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def async_database_url(self) -> str:
        """Convert sync postgresql:// URL to psycopg3-compatible postgresql+psycopg://"""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
