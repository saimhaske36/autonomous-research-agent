from sqlalchemy.orm import Session

from app.models.research_job import ResearchJob


class ResearchRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, job: ResearchJob):

        self.db.add(job)

        self.db.commit()

        self.db.refresh(job)

        return job

    def get_by_id(self, job_id: str):

        return (
            self.db.query(ResearchJob)
            .filter(
                ResearchJob.id == job_id
            )
            .first()
        )
    

    def get_all(self):

        return (
        self.db
        .query(ResearchJob)
        .order_by(
            ResearchJob.created_at.desc()
        )
        .all()
        )
    

    def get_stats(self):

        jobs = (
            self.db.query(
                ResearchJob
            ).all()
        )

        return {
            "total_jobs": len(jobs),

            "total_sources": sum(
                j.source_count or 0
                for j in jobs
            ),

            "total_findings": sum(
                j.finding_count or 0
                for j in jobs
            )
        }
    
    def update_progress(
        self,
        job_id: str,
        status: str,
        progress: int
        ):

        job = self.get_by_id(job_id)

        if job:
            job.status = status

            job.progress = progress

            self.db.commit()

            