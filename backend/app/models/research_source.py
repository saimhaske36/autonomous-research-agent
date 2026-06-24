from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Text

from app.models.base import Base


class ResearchSource(Base):
    __tablename__ = "research_sources"

    id = Column(
        String,
        primary_key=True
    )

    job_id = Column(
        String,
        ForeignKey("research_jobs.id"),
        nullable=False
    )

    title = Column(String)

    url = Column(String)

    content = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )