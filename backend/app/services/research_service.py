import uuid
import json
from app.models.research_source import (
    ResearchSource
)

from app.repositories.source_repository import (
    SourceRepository
)

from sqlalchemy.orm import Session
from sqlalchemy import Text

from app.models.research_job import ResearchJob

from app.repositories.research_repository import (
    ResearchRepository
)

from app.workflows.research_workflow import (
    build_graph
)

from app.models.research_finding import (
    ResearchFinding
)
from app.models.research_analysis import (
    ResearchAnalysis
)

from app.repositories.finding_repository import (
    FindingRepository
)

from app.repositories.analysis_repository import (
    AnalysisRepository
)

from app.services.pdf_service import (
    PDFService
)
from fastapi import BackgroundTasks


class ResearchService:

    def __init__(
        self,
        db: Session
    ):

        self.repository = (
            ResearchRepository(db)
        )
        self.source_repository = (
            SourceRepository(db)
        )
        self.finding_repository = (
            FindingRepository(db)
        )
        self.analysis_repository = (
            AnalysisRepository(db)
        )

        self.workflow = build_graph()

    def run_workflow(
        self,
        job_id: str,
        topic: str
        ):
        state = {
            "job_id": job_id,
            "topic": topic,
            "status": "created",
            "research_plan": [],
            "search_queries": [],
            "sources": [],
            "findings": [],
            "analysis": {},
            "insights": [],
            "final_report": "",
            "references": [],
            "pdf_path": "",
            "errors": []
        }

        result = self.workflow.invoke(
            state
        )    

        job = self.repository.get_by_id(
            job_id
        )

        job.status = "completed"
        job.progress = 100

        job.final_report = (
            result["final_report"]
        )

        job.source_count = len(
            result["sources"]
        )

        job.finding_count = len(
            result["findings"]
        )

        self.repository.db.commit()



        # job = ResearchJob(
        #     id=str(uuid.uuid4()),
        #     topic=topic,
        #     status="created",
        #     final_report=""
        # )
        # self.repository.update_progress(
        #         job.id,
        #         10,
        #         "Planning"
        #     )

        # self.repository.create(job)

        # job.status = result["status"]

        # self.repository.db.commit()

        print("\nFINAL REPORT")
        print(
            result["final_report"][:1000]
        )


        print("\nANALYSIS")
        print(result["analysis"])

        job.source_count = len(
            result["sources"]
        )

        self.repository.db.commit() 

        job.final_report = (
            result["final_report"]
        )

        pdf_path = (
        PDFService.generate_report(
        job.id,
        result["final_report"]
        )
    )

        job.pdf_path = pdf_path

        self.repository.db.commit()

        for source in result["sources"]:

            source_record = (
                ResearchSource(
                    id=str(uuid.uuid4()),
                    job_id=job.id,
                    title=source.get(
                        "title",
                        ""
                    ),
                    url=source.get(
                        "url",
                        ""
                    ),
                    content=source.get(
                        "content",
                        ""
                    )
                )
            )

            self.source_repository.create(
                source_record
            )


        job.finding_count = len(
            result["findings"]
        )

        self.repository.db.commit()

        for finding in result["findings"]:

            finding_record = (
                ResearchFinding(
                    id=str(uuid.uuid4()),
                    job_id=job.id,
                    finding=finding.get(
                        "fact",
                        ""
                    ),
                    source_url=""
                )
            )

            self.finding_repository.create(
                finding_record
            ) 

        self.repository.db.commit()

        analysis_record = (
            ResearchAnalysis(
                id=str(uuid.uuid4()),
                job_id=job.id,

                executive_summary=
                result["analysis"].get(
                    "executive_summary",
                    ""
                ),

                opportunities=
                json.dumps(
                    result["analysis"].get(
                        "opportunities",
                        []
                    )
                ),

                risks=
                json.dumps(
                    result["analysis"].get(
                        "risks",
                        []
                    )
                ),

                trends=
                json.dumps(
                    result["analysis"].get(
                        "trends",
                        []
                    )
                )
            )
        )

        self.analysis_repository.create(
            analysis_record
        )   
           



        print("\nRESEARCH PLAN")
        print(result["research_plan"])

        print("\nSOURCES")
        print(result["sources"][:3])
        

        print(
            result["research_plan"]
        )

        print(
            "\nPDF GENERATED:"
        )

        print(
            pdf_path
        )

        return job

    def get_job(
        self,
        job_id: str
    ):
        return self.repository.get_by_id(
            job_id
        )
    def get_sources(
    self,
    job_id: str
    ):

        return (
        self.source_repository
        .get_by_job_id(job_id)
    )
    def get_findings(
    self,
    job_id: str
    ):

        return (
        self.finding_repository
        .get_by_job_id(job_id)
    )
    def get_analysis(
    self,
    job_id: str
    ):

        return (
        self.analysis_repository
        .get_by_job_id(job_id)
    )

    def get_all_jobs(self, user_id: str = None):
        if user_id and user_id != "admin":
            from sqlalchemy import desc
            return (
                self.repository.db.query(ResearchJob)
                .filter(ResearchJob.user_id == user_id)
                .order_by(desc(ResearchJob.created_at))
                .all()
            )
        return self.repository.get_all()
    

    def get_stats(self, user_id: str = None):
        if user_id and user_id != "admin":
            jobs = (
                self.repository.db.query(ResearchJob)
                .filter(ResearchJob.user_id == user_id)
                .all()
            )
        else:
            jobs = self.repository.get_all()

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
    
    def delete_job(self, job_id: str) -> bool:
        import os
        from app.models.research_source import ResearchSource
        from app.models.research_finding import ResearchFinding
        from app.models.research_analysis import ResearchAnalysis
        from app.models.research_report import ResearchReport

        job = self.repository.get_by_id(job_id)
        if not job:
            return False

        # Delete the PDF file if it exists
        if job.pdf_path:
            try:
                if os.path.exists(job.pdf_path):
                    os.remove(job.pdf_path)
            except Exception as e:
                print(f"Error removing PDF file: {e}")

        # Cascading deletes for database associations
        self.repository.db.query(ResearchSource).filter(ResearchSource.job_id == job_id).delete(synchronize_session=False)
        self.repository.db.query(ResearchFinding).filter(ResearchFinding.job_id == job_id).delete(synchronize_session=False)
        self.repository.db.query(ResearchAnalysis).filter(ResearchAnalysis.job_id == job_id).delete(synchronize_session=False)
        self.repository.db.query(ResearchReport).filter(ResearchReport.job_id == job_id).delete(synchronize_session=False)

        # Delete job row itself
        self.repository.db.delete(job)
        self.repository.db.commit()
        return True
    

    def create_job(
        self,
        topic: str,
        user_id: str,
        background_tasks: BackgroundTasks
    ):

        job = ResearchJob(
            id=str(uuid.uuid4()),
            user_id=user_id,
            topic=topic,
            status="created",
            progress=0,
            final_report=""
        )

        self.repository.create(job)

        background_tasks.add_task(
            self.run_workflow,
            job.id,
            topic
        )

        return job