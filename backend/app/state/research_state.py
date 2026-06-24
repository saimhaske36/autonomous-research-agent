from typing import TypedDict


class ResearchState(TypedDict):

    job_id: str

    topic: str

    status: str

    progress: int

    research_plan: list[str]

    search_queries: list[str]

    sources: list[dict]

    findings: list[dict]

    analysis: dict
    
    insights: list

    final_report: str

    references: list

    pdf_path: str

    errors: list[str]