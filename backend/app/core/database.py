from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base

from app.models.research_job import ResearchJob
from app.models.research_source import ResearchSource
from app.models.research_finding import ResearchFinding
from app.models.research_report import ResearchReport
from app.models.research_analysis import ResearchAnalysis
from app.models.user import User

from app.core.config import get_settings

settings = get_settings()

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

from sqlalchemy import text

Base.metadata.create_all(
    bind=engine
)

# Auto-migration: Ensure user_id column exists
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE research_jobs ADD COLUMN user_id VARCHAR;"))
except Exception:
    pass

# Auto-migration: Ensure email and reset_token columns exist in users table
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR;"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR;"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN login_otp VARCHAR;"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN login_otp_expires_at TIMESTAMP;"))
except Exception:
    pass


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()