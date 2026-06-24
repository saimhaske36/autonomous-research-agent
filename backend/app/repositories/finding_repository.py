from sqlalchemy.orm import Session

from app.models.research_finding import (
    ResearchFinding
)


class FindingRepository:

    def __init__(
        self,
        db: Session
    ):
        self.db = db

    def create(
        self,
        finding: ResearchFinding
    ):

        self.db.add(finding)

        self.db.commit()

        self.db.refresh(finding)

        return finding

    def get_by_job_id(
        self,
        job_id: str
    ):

        return (
            self.db.query(
                ResearchFinding
            )
            .filter(
                ResearchFinding.job_id
                == job_id
            )
            .all()
        )