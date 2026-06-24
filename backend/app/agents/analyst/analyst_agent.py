import json

from app.state.research_state import (
    ResearchState
)

from app.providers.llm.factory import (
    LLMFactory
)


class AnalystAgent:

    def __init__(self):

        self.llm = (
            LLMFactory.get_provider()
        )

    def run(
        self,
        state: ResearchState
    ) -> ResearchState:
        
        print("ANALYST AGENT STARTED")

        findings_text = "\n".join(

            [
                f["fact"]

                for f in state["findings"]
            ]
        )

        prompt = f"""
You are a senior market analyst.

Analyze these findings.

Return JSON only.

Format:

{{
    "executive_summary":"",
    "trends":[],
    "opportunities":[],
    "risks":[]
}}

Findings:

{findings_text}
"""

        response = (
            self.llm.generate(
                prompt
            )
        )

        try:

            cleaned = (
                response
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

            state["analysis"] = (
                json.loads(cleaned)
            )

        except Exception as e:

            print(
                "ANALYSIS PARSE ERROR:",
                e
            )

            state["analysis"] = {
                "executive_summary":
                response,

                "trends": [],

                "opportunities": [],

                "risks": []
            }

        state["status"] = "analyzing"
        state["progress"] = 80
        return state