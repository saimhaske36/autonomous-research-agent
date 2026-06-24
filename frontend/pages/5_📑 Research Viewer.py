import streamlit as st
import pandas as pd

from services.api import (
    get_all_jobs
)

st.title(
    "📚 Research History"
)

jobs = get_all_jobs()

def color_status(status):

    colors = {
        "planning": "🟡 Planning",
        "collecting_sources": "📚 Collecting Sources",
        "extracting_findings": "🔍 Extracting Findings",
        "analyzing": "🧠 Analyzing",
        "generating_report": "📄 Generating Report",
        "completed": "🟢 Completed"
    }

    return colors.get(
        status,
        status
    )

if jobs:

    df = pd.DataFrame(jobs)

progress_map = {
    "planning": 20,
    "collecting_sources": 40,
    "extracting_findings": 60,
    "analyzing": 80,
    "generating_report": 90,
    "completed": 100
}

for job in jobs:

    st.subheader(job["topic"])

    status = job["status"]

    st.write(
        f"Status: {color_status(status)}"
    )

    st.progress(
        progress_map.get(
            status,
            0
        )
    )

    st.write(
        f"Sources: {job['source_count']}"
    )

    st.write(
        f"Findings: {job['finding_count']}"
    )

    st.divider()

else:

    st.info(
        "No research jobs found."
    )