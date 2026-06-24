import streamlit as st
import pandas as pd

from services.api import (
    get_all_jobs
)

st.title(
    "📈 Analytics"
)

jobs = get_all_jobs()

df = pd.DataFrame(jobs)

st.bar_chart(
    df["source_count"]
)

st.bar_chart(
    df["finding_count"]
)

st.subheader(
    "Research Topics"
)

st.dataframe(
    df[
        [
            "topic",
            "source_count",
            "finding_count"
        ]
    ]
)