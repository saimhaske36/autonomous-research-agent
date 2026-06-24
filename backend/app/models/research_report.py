from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Text

from app.models.base import Base


class ResearchReport(Base):
    __tablename__ = "research_reports"

    id = Column(String, primary_key=True)

    job_id = Column(
        String,
        ForeignKey("research_jobs.id")
    )

    summary = Column(Text)

    report_content = Column(Text)

    pdf_path = Column(String)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )