from pydantic import BaseModel


class CreateResearchRequest(BaseModel):
    topic: str


class CreateResearchResponse(BaseModel):
    job_id: str
    status: str


class ResearchStatusResponse(BaseModel):
    job_id: str
    topic: str
    status: str
    progress:int
    source_count: int
    finding_count: int


