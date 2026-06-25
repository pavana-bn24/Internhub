from pydantic_settings import BaseSettings
from typing import Optional
import logging
from warnings import warn


class Settings(BaseSettings):
    PROJECT_NAME: str = "InternHub"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database — defaults to main DB; override TEST_DATABASE_URL for tests
    DATABASE_URL: str = "sqlite:///./internhub.db"
    TEST_DATABASE_URL: Optional[str] = None

    SECRET_KEY: str = "super-secret-key-change-in-production-internhub-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ADMIN_EMAIL: str = "admin@internhub.com"
    ADMIN_USERNAME: str = "internhub_admin"
    ADMIN_PASSWORD: str = "admin123"

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

if "changeme" in settings.SECRET_KEY.lower() or settings.SECRET_KEY == "super-secret-key-change-in-production-internhub-2024":
    warn("WARNING: Using default SECRET_KEY. Set a strong random value in .env for production.", stacklevel=2)

if settings.ADMIN_PASSWORD == "admin123":
    warn("WARNING: Using default ADMIN_PASSWORD. Change it in .env for production.", stacklevel=2)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
)
logger = logging.getLogger("internhub")
