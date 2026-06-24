import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"


def create_research(topic: str):

    response = requests.post(
        f"{BASE_URL}/research",
        json={"topic": topic}
    )
    print("STATUS:", response.status_code)
    print("TEXT:", response.text)

    return response.json()


def get_job(job_id: str):

    response = requests.get(
        f"{BASE_URL}/research/{job_id}"
    )

    return response.json()


def get_sources(job_id: str):

    response = requests.get(
        f"{BASE_URL}/research/{job_id}/sources"
    )

    return response.json()


def get_findings(job_id: str):

    response = requests.get(
        f"{BASE_URL}/research/{job_id}/findings"
    )

    return response.json()


def get_analysis(job_id: str):

    response = requests.get(
        f"{BASE_URL}/research/{job_id}/analysis"
    )
    # print("STATUS:", response.status_code)
    # print("TEXT:", response.text)

    return response.json()


def download_report(job_id: str):

    response = requests.get(
        f"{BASE_URL}/research/{job_id}/report"
    )

    return response.content


def get_all_jobs():

    response = requests.get(
        f"{BASE_URL}/research"
    )

    return response.json()



def get_stats():

    response = requests.get(
        f"{BASE_URL}/research/stats"
    )

    print("STATUS:", response.status_code)
    print("TEXT:", response.text)

    return response.json()

def get_job(job_id):

    response = requests.get(
        f"{BASE_URL}/research/{job_id}"
    )

    return response.json()