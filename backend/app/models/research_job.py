from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import Integer
from sqlalchemy import Text

from app.models.base import Base


class ResearchJob(Base):
    __tablename__ = "research_jobs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)

    topic = Column(String, nullable=False)

    status = Column(
        String,
        nullable=False,
        default="string"
    )

    progress = Column(Integer, default=0)

    final_report = Column(
        Text,
        nullable=True
    )

    source_count = Column(
    Integer,
    default=0
    )

    finding_count = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )

    pdf_path = Column(
    String,
    nullable=True
    )


