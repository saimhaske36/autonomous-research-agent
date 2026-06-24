from pydantic import BaseModel


class FindingResponse(BaseModel):

    finding: str

    source_url: str