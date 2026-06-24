from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base

from app.models.research_job import ResearchJob
from app.models.research_source import ResearchSource
from app.models.research_finding import ResearchFinding
from app.models.research_report import ResearchReport
from app.models.research_analysis import ResearchAnalysis

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base.metadata.create_all(
    bind=engine
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()