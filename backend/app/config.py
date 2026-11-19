"""Amar Para backend — কনফিগারেশন (.env থেকে, কোডে কোনো সিক্রেট নেই)।"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = "development"
    database_url: str = "sqlite:///./amarpara.db"
    secret_key: str = "dev-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # ৭ দিন
    cors_origins: str = "http://localhost:4200,http://localhost:3000"
    upload_dir: str = "uploads"
    max_image_size_mb: int = 5
    max_images_per_post: int = 5
    sms_provider: str = "log"  # log | env
    sms_api_key: str = ""
    sms_api_url: str = ""
    sms_sender_id: str = "AmarPara"
    job_secret: str = ""
    rate_limit_default: str = "100/minute"

    @property
    def is_development(self) -> bool:
        return self.env.lower() == "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_image_bytes(self) -> int:
        return self.max_image_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
