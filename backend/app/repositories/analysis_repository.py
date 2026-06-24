from sqlalchemy.orm import Session

from app.models.research_analysis import (
    ResearchAnalysis
)


class AnalysisRepository:

    def __init__(
        self,
        db: Session
    ):
        self.db = db

    def create(
        self,
        analysis: ResearchAnalysis
    ):

        self.db.add(analysis)

        self.db.commit()

        self.db.refresh(analysis)

        return analysis

    def get_by_job_id(
        self,
        job_id: str
    ):

        return (
            self.db.query(
                ResearchAnalysis
            )
            .filter(
                ResearchAnalysis.job_id
                == job_id
            )
            .first()
        )