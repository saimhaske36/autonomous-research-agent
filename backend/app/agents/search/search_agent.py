from app.state.research_state import (
    ResearchState
)

from app.providers.search.tavily_provider import (
    TavilyProvider
)


class SearchAgent:

    def __init__(self):

        self.search_provider = (
            TavilyProvider()
        )

    def run(
        self,
        state: ResearchState
    ) -> ResearchState:

        all_sources = []

        seen_urls = set()

        for topic in state["research_plan"]:

            query = f"{state['topic']} {topic}"

            results = self.search_provider.search(query)

            for result in results:

                source = {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "content": result.get("content", "")
                }

                if source["url"] not in seen_urls:

                    seen_urls.add(source["url"])

                    all_sources.append(source)

        state["sources"] = all_sources

        print(
            f"Sources Found: {len(all_sources)}"
        )

        state["status"] = "searching"
        state["progress"] = 40

        return state