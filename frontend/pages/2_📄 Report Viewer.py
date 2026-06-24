import streamlit as st

from services.api import (
    get_sources,
    get_findings,
    get_analysis,
    download_report
)
from services.api import get_job

st.title(
    "📄 Research Report Viewer"
)

job_id = st.session_state.get("job_id")
job = get_job(job_id)
topic_id = st.session_state.get("topic")

st.subheader(
    f"**📌 Research Topic:**  {job['topic']}"
)

st.subheader(
    f"**🆔 Job ID:** `{job_id}`"
)


if job_id:

    sources = get_sources(job_id)

    st.subheader("Sources")

    for source in sources:

        st.markdown(
            f"### {source['title']}"
        )

        st.markdown(
            f"[Open Source]({source['url']})"
        )

        with st.expander(source["title"]):
            st.markdown(
                f"[Open Source]({source['url']})"
            )

            st.write(
                source["content"][:500] + "..."
            )
    st.divider()

    st.subheader("Findings")

    findings = get_findings(job_id)

    for finding in findings:

            st.success(
                finding["finding"]
            )

    st.subheader(
            "Analysis"
        )

    # try:
    analysis = get_analysis(job_id)

    # except Exception:

    #     st.warning(
    #         "Research still processing. Please refresh in a few seconds."
    # )

    # st.stop()
    # st.write(analysis)

    st.subheader(
            "Executive Summary"
        )

    st.write(
            analysis["executive_summary"]
        )

    st.subheader(
            "Trends"
        )

    trends = analysis.get("trends", [])

    if isinstance(trends, str):
        st.write(trends)
    else:
        for trend in trends:
            st.success(trend)

    st.subheader(
        "Opportunities"
    )

    for item in analysis["opportunities"]:
        st.info(item)

    st.subheader(
        "Risks"
    )

    for item in analysis["risks"]:
        st.warning(item)

    pdf = download_report(job_id)

    st.download_button(
        label="📥 Download PDF",
        data=pdf,
        file_name=f"{job_id}.pdf",
        mime="application/pdf"
    )

    from services.api import (
        download_report
    )

