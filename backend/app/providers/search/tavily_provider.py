from tavily import TavilyClient

from app.core.config import get_settings

from app.providers.search.base import (
    BaseSearchProvider
)

settings = get_settings()


class TavilyProvider(BaseSearchProvider):

    def __init__(self):

        self.client = TavilyClient(
            api_key=settings.TAVILY_API_KEY
        )

    def search(
        self,
        query: str
    ):

        result = self.client.search(
            query=query,
            max_results=5
        )

        return result.get(
            "results",
            []
        )