import json
import re

from app.state.research_state import ResearchState
from app.providers.llm.factory import LLMFactory

from app.repositories.research_repository import ( ResearchRepository)

class PlannerAgent:

    def __init__(self):
        self.llm = LLMFactory.get_provider()

    def run(
        self,
        state: ResearchState
    ) -> ResearchState:

        prompt = f"""
You are a professional research planner.

Research Topic:
{state["topic"]}

Generate 5-7 research areas.

Return ONLY a JSON array.

Example:

[
    "Market Overview",
    "Market Size",
    "Government Policies",
    "Major Companies",
    "Challenges",
    "Future Trends"
]
"""

        response = self.llm.generate(prompt)

        print("\nRAW RESPONSE:")
        print(response)

        try:
            plan = json.loads(response)

        except Exception:

            matches = re.search(
                r"\[.*\]",
                response,
                re.DOTALL
            )

            if matches:
                plan = json.loads(
                    matches.group()
                )

            else:
                plan = [
                    "Market Overview",
                    "Market Size",
                    "Government Policies",
                    "Major Companies",
                    "Challenges",
                    "Future Trends"
                ]

        state["research_plan"] = plan


        state["status"] = "planning"
        state["progress"] = 20



        return state
    

  