from sqlalchemy.orm import Session

from app.models.research_source import (
    ResearchSource
)


class SourceRepository:

    def __init__(
        self,
        db: Session
    ):
        self.db = db

    def create(
        self,
        source: ResearchSource
    ):

        self.db.add(source)

        self.db.commit()

        self.db.refresh(source)

        return source

    def get_by_job_id(
        self,
        job_id: str
    ):

        return (
            self.db.query(
                ResearchSource
            )
            .filter(
                ResearchSource.job_id
                == job_id
            )
            .all()
        )