from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

from .config import settings

# Allow separate test database via environment variable (set in conftest.py or shell)
_test_url = os.environ.get("TEST_DATABASE_URL")
db_url = _test_url if _test_url else settings.DATABASE_URL

# SQLite requires check_same_thread=False for FastAPI; other engines (PostgreSQL, MySQL) do not
_connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=_connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
