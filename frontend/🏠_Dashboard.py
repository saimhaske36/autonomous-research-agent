import streamlit as st

from services.api import (
    get_stats
)

st.set_page_config(
    page_title="Autonomous Research Agent",
    layout="wide"
)

st.title("🤖 Autonomous Research Agent")

stats = get_stats()

col1, col2, col3 = st.columns(3)

with col1:
    st.metric(
        "Research Jobs",
        stats["total_jobs"]
    )

with col2:
    st.metric(
        "Sources",
        stats["total_sources"]
    )

with col3:
    st.metric(
        "Findings",
        stats["total_findings"]
    )


import pandas as pd
import plotly.express as px

from services.api import (
    get_all_jobs
)

jobs = get_all_jobs()

if jobs:

    df = pd.DataFrame(
        jobs
    )

    st.subheader(
        "Sources Per Research"
    )

    fig = px.bar(
        df,
        x="topic",
        y="source_count"
    )

    st.plotly_chart(
        fig,
        use_container_width=True
    )


    st.subheader(
    "Findings Per Research"
)

fig2 = px.bar(
    df,
    x="topic",
    y="finding_count"
)

st.plotly_chart(
    fig2,
    use_container_width=True
)

import pandas as pd

chart_data = pd.DataFrame({
    "Metric": [
        "Jobs",
        "Sources",
        "Findings"
    ],
    "Count": [
        stats["total_jobs"],
        stats["total_sources"],
        stats["total_findings"]
    ]
})

st.subheader(
    "Research Analytics"
)

st.bar_chart(
    chart_data.set_index(
        "Metric"
    )
)

st.divider()

st.subheader(
    "Project Overview"
)

st.info(
    """
    Autonomous Research Agent

    • Multi-Agent Workflow
    • Groq LLM
    • LangGraph
    • FastAPI Backend
    • Streamlit Frontend
    • PDF Report Generation
    • Analytics Dashboard
    """
)