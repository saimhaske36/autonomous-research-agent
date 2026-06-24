from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.research import (
    CreateResearchRequest,
    CreateResearchResponse,
    ResearchStatusResponse
)

from app.services.research_service import (
    ResearchService
)

router = APIRouter()


@router.post(
    "/research",
    response_model=CreateResearchResponse
)
def create_research_job(
    request: CreateResearchRequest,
    db: Session = Depends(get_db)
):

    service = ResearchService(db)

    job = service.create_job(
        topic=request.topic
    )

    return CreateResearchResponse(
        job_id=job.id,
        status=job.status
    )

@router.get("/research/stats")
def get_stats(
    db: Session = Depends(get_db)
):
    service = ResearchService(db)

    return service.get_stats()


@router.get(
    "/research/{job_id}",
    response_model=ResearchStatusResponse
)
def get_research_job(
    job_id: str,
    db: Session = Depends(get_db)
):

    service = ResearchService(db)

    job = service.get_job(job_id)

    if not job:
        raise HTTPException(
        status_code=404,
        detail="Job not found"
    )

    return ResearchStatusResponse(
        job_id=job.id,
        topic=job.topic,
        status=job.status,
        progress=job.progress,
        source_count=job.source_count,
        finding_count=job.finding_count
    )


from app.schemas.source import (
    SourceResponse
)
@router.get(
    "/research/{job_id}/sources",
    response_model=list[SourceResponse]
)
def get_sources(
    job_id: str,
    db: Session = Depends(get_db)
):

    service = ResearchService(db)

    sources = service.get_sources(
        job_id
    )

    return [
        SourceResponse(
            title=s.title,
            url=s.url,
            content=s.content
        )
        for s in sources
    ]


from app.schemas.finding import (
    FindingResponse
)

@router.get(
    "/research/{job_id}/findings",
    response_model=list[FindingResponse]
)
def get_findings(
    job_id: str,
    db: Session = Depends(get_db)
):

    service = ResearchService(db)

    findings = (
        service.get_findings(
            job_id
        )
    )

    return [
        FindingResponse(
            finding=f.finding,
            source_url=f.source_url
        )
        for f in findings
    ]

from app.schemas.analysis import (
    AnalysisResponse
)
import json

@router.get(
    "/research/{job_id}/analysis"
)
def get_analysis(
    job_id: str,
    db: Session = Depends(get_db)
):

    service = ResearchService(db)

    analysis = service.get_analysis(
        job_id
    )
    print("JOB ID =", job_id)
    print("ANALYSIS =", analysis)

    return {
        "executive_summary":
            analysis.executive_summary,

        "trends":
            json.loads(
                analysis.trends or "[]"
            ),

        "opportunities":
            json.loads(
                analysis.opportunities or "[]"
            ),

        "risks":
            json.loads(
                analysis.risks or "[]"
            )
    }

from fastapi.responses import (
    FileResponse
)

@router.get(
    "/research/{job_id}/report"
)
def download_report(
    job_id: str,
    db: Session = Depends(
        get_db
    )
):

    service = (
        ResearchService(db)
    )

    job = (
        service.get_job(job_id)
    )

    return FileResponse(
        path=job.pdf_path,
        media_type="application/pdf",
        filename=f"{job_id}.pdf"
    )


@router.get(
    "/research"
)
def get_all_jobs(
    db: Session = Depends(
        get_db
    )
):

    service = (
        ResearchService(db)
    )

    return (
        service.get_all_jobs()
    )

