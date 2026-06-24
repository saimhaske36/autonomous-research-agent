from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from app.models.base import Base


class ResearchFinding(Base):
    __tablename__ = "research_findings"

    id = Column(String, primary_key=True)

    job_id = Column(
        String,
        ForeignKey("research_jobs.id")
    )

    finding = Column(String)

    source_url = Column(String)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )