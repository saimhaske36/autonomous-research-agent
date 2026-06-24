from app.state.research_state import (
    ResearchState
)

from app.providers.llm.factory import (
    LLMFactory
)


class WriterAgent:

    def __init__(self):

        self.llm = (
            LLMFactory.get_provider()
        )

    def run(
        self,
        state: ResearchState
    ) -> ResearchState:
        
        print("WRITER AGENT STARTED")

        findings_text = "\n".join(
            [
                f["fact"]
                for f in state["findings"]
            ]
        )

        analysis = state["analysis"]

        prompt = f"""
You are a professional research report writer.

Create a detailed report.

Topic:
{state["topic"]}

Executive Summary:
{analysis.get("executive_summary","")}

Trends:
{analysis.get("trends",[])}

Opportunities:
{analysis.get("opportunities",[])}

Risks:
{analysis.get("risks",[])}

Findings:
{findings_text}

Create report with sections:

# Executive Summary

# Market Overview

# Key Trends

# Opportunities

# Risks

# Conclusion
"""

        report = (
            self.llm.generate(
                prompt
            )
        )

        state["final_report"] = (
            report
        )

        state["status"] = "writing"
        state["progress"] = 90

        state["status"] = "completed"
        state["progress"] = 100

        return state