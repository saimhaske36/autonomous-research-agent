from langgraph.graph import (
    StateGraph,
    END
)

from app.state.research_state import (
    ResearchState
)

from app.agents.planner.planner_agent import (
    PlannerAgent
)

from app.agents.search.search_agent import (
    SearchAgent
)

from app.agents.reader.reader_agent import (
    ReaderAgent
)

from app.agents.analyst.analyst_agent import (
    AnalystAgent
)

from app.agents.writer.writer_agent import (
    WriterAgent
)


planner = PlannerAgent()

search = SearchAgent()

reader = ReaderAgent()

analyst = AnalystAgent()

writer = WriterAgent()

from app.core.database import SessionLocal
from app.models.research_job import ResearchJob

def update_job_status(job_id: str, status: str, progress: int):
    db = SessionLocal()
    try:
        job = db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
        if job:
            job.status = status
            job.progress = progress
            db.commit()
    except Exception as e:
        print(f"Error updating job progress: {e}")
    finally:
        db.close()

def planner_node(
    state: ResearchState
):
    update_job_status(state["job_id"], "planning", 20)
    state["status"] = "planning"
    return planner.run(state)


def search_node(
    state: ResearchState
):
    update_job_status(state["job_id"], "collecting_sources", 40)
    state["status"] = "collecting_sources"
    return search.run(state)

def reader_node(
    state: ResearchState
):
    update_job_status(state["job_id"], "extracting_findings", 60)
    state["status"] = "extracting_findings"
    return reader.run(state)

def analyst_node(
    state: ResearchState
):
    update_job_status(state["job_id"], "analyzing", 80)
    state["status"] = "analyzing"
    return analyst.run(state)

def writer_node(
    state: ResearchState
):
    update_job_status(state["job_id"], "generating_report", 90)
    state["status"] = "generating_report"
    state = writer.run(state)
    state["status"] = "completed"
    update_job_status(state["job_id"], "completed", 100)

    return state

def build_graph():

    graph = StateGraph(
        ResearchState
    )

    graph.add_node(
        "planner",
        planner_node
    )

    graph.add_node(
        "search",
        search_node
    )

    graph.set_entry_point(
        "planner"
    )

    graph.add_edge(
        "planner",
        "search"
    )

    graph.add_node(
        "reader",
        reader_node
    )

    graph.add_edge(
        "planner",
        "search"
    )

    graph.add_edge(
        "search",
        "reader"
    )

    graph.add_node(
        "analyst",
        analyst_node
    )

    graph.add_edge(
        "reader",
        "analyst"
    )

    graph.add_node(
    "writer",
    writer_node
    )

    graph.add_edge(
        "analyst",
        "writer"
    )

    graph.add_edge(
        "writer",
        END
    )

    return graph.compile()