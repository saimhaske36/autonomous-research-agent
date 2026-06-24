from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime

from app.models.base import Base


class ResearchAnalysis(Base):

    __tablename__ = "research_analysis"

    id = Column(
        String,
        primary_key=True
    )

    job_id = Column(
        String,
        nullable=False
    )

    executive_summary = Column(Text)

    opportunities = Column(Text)

    risks = Column(Text)

    trends = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )