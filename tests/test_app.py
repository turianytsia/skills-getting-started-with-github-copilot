from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

import src.app as activity_app


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(activity_app, "activities", deepcopy(activity_app.activities))
    return TestClient(activity_app.app)


def test_get_activities_returns_activity_data(client):
    response = client.get("/activities")

    assert response.status_code == 200
    activities = response.json()
    assert "Chess Club" in activities
    assert activities["Chess Club"]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_signup_adds_participant(client):
    email = "student@mergington.edu"

    response = client.post("/activities/Basketball Team/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Basketball Team"}
    activities_response = client.get("/activities")
    assert email in activities_response.json()["Basketball Team"]["participants"]


def test_duplicate_signup_is_rejected_without_adding_participant(client):
    email = "michael@mergington.edu"

    response = client.post("/activities/Chess Club/signup", params={"email": email})

    assert response.status_code == 400
    assert response.json() == {"detail": "Student is already signed up for this activity"}
    participants = client.get("/activities").json()["Chess Club"]["participants"]
    assert participants.count(email) == 1


def test_signup_rejects_unknown_activity(client):
    response = client.post(
        "/activities/Unknown Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_signup_requires_email(client):
    response = client.post("/activities/Basketball Team/signup")

    assert response.status_code == 422


def test_root_redirects_to_frontend(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"