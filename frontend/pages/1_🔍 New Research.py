import streamlit as st

from services.api import (
    create_research
)

from services.api import (
    create_research,
    get_job
)
from services.api import get_job
import time

st.title(
    "🔍 New Research"
)

topic = st.text_input(
    "Research Topic",
    key="research_topic_input"
)

import time

if st.button("Start Research"):

    if topic:

        response = create_research(topic)

        job_id = response["job_id"]

        st.session_state["job_id"] = job_id

        progress_bar = st.progress(0)

        status_box = st.empty()

        while True:

            job = get_job(job_id)

            progress_bar.progress(
                job.get("progress", 0)
            )

            # status_box.info(
            #     f"Status: {job['status']}"
            # )

            if job["status"] == "completed":

                st.success(
                    "✅ Research Completed"
                )

                st.session_state[
                    "research_done"
                ] = True

                break

            time.sleep(1)

    
    if st.session_state.get("research_done"):

        st.page_link(
         "pages/2_📄 Report Viewer.py",
            label="View Report",
            icon="📄"
    )
            

    if st.button(
                    "🔎 New Research"
                ):
                    st.rerun()