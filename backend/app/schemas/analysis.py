from pydantic import BaseModel


class AnalysisResponse(BaseModel):

    executive_summary: str

    opportunities: list[str]

    risks: list[str]

    trends: list[str]

    class Config:
        from_attributes = True