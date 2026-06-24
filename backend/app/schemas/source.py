from pydantic import BaseModel


class SourceResponse(BaseModel):

    title: str

    url: str

    content: str