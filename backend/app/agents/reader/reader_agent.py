import json

from app.state.research_state import (
    ResearchState
)

from app.providers.llm.factory import (
    LLMFactory
)


class ReaderAgent:

    def __init__(self):

        self.llm = (
            LLMFactory.get_provider()
        )

    def run(
        self,
        state: ResearchState
    ) -> ResearchState:

        findings = []

        sources = state["sources"][:3]

        for source in sources:

            content = source.get(
                "content",
                ""
            )

            if not content:
                continue

            prompt = f"""
You are a research analyst.

Extract important findings.

Return JSON only.

Example:

[
  {{
    "fact":
    "Market expected to reach 20B by 2030"
  }}
]

Content:

{content[:1000]}
"""

            response = (
                self.llm.generate(
                    prompt
                )
            )

            try:

                extracted = (
                    json.loads(response)
                )

                findings.extend(
                    extracted
                )

            except Exception:

                continue

        state["findings"] = findings

        print(
            f"Findings Extracted: {len(findings)}"
        )

        state["status"] = "reading"
        state["progress"] = 60
        return state
    