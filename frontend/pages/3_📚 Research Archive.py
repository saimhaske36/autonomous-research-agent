import streamlit as st

from services.api import (
    get_all_jobs
)

st.title(
    "📚 Research History"
)

jobs = get_all_jobs()

search = st.text_input(
    "Search Research",
    key="history_search"
)

filtered = [
    job
    for job in jobs
    if search.lower() in job["topic"].lower()
]

for job in filtered:

    with st.expander(
        f"{job['topic']}"
    ):

        st.write(
            f"Status: {job['status']}"
        )

        st.write(
            f"Sources: {job['source_count']}"
        )

        st.write(
            f"Findings: {job['finding_count']}"
        )

        if st.button(
            "📄 View Report",
            key=f"report_{job['id']}"
        ):

            st.session_state["job_id"] = job["id"]

            st.switch_page(
                "pages/2_📄 Report Viewer.py"
            )