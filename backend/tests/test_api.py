"""Integration tests for the VisionCheck FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from main import app
from scheduler import stop_scheduler


@pytest.fixture(scope="module")
def client():
    """Create a TestClient with proper lifespan management."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    stop_scheduler()


def test_api_health(client):
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "VisionCheck API"
    assert "timestamp" in data
    assert "uptime_seconds" in data


def test_api_validation_rules(client):
    """Test validation rules endpoint."""
    response = client.get("/api/validation-rules")
    assert response.status_code == 200
    data = response.json()
    assert "limits" in data
    assert data["limits"]["sph_min"] == -20.00
    assert data["limits"]["sph_max"] == 20.00
    assert data["limits"]["cyl_min"] == -10.00
    assert data["limits"]["cyl_max"] == 10.00
    assert data["limits"]["axis_min"] == 0
    assert data["limits"]["axis_max"] == 180
    assert len(data["rules"]) > 0
    assert "disclaimer" in data


def test_api_validate_prescription_spec_example(client):
    """Test the exact example from section 5 of the problem statement."""
    payload = {
        "left_eye": {
            "sph": -2.50,
            "cyl": -1.00,
            "axis": 180,
        },
        "right_eye": {
            "sph": 25.00,
            "cyl": -0.75,
            "axis": 90,
        },
    }
    response = client.post("/api/validate-prescription", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["overall_status"] == "INVALID"
    assert data["left_eye"]["status"] == "VALID"
    assert len(data["left_eye"]["errors"]) == 0
    assert data["right_eye"]["status"] == "INVALID"
    assert len(data["right_eye"]["errors"]) == 1
    assert data["right_eye"]["errors"][0]["field"] == "sph"
    assert "25.00" in data["right_eye"]["errors"][0]["message"]
    assert data["total_errors"] == 1


def test_api_validate_valid_prescription(client):
    """Test validation with a fully valid prescription."""
    payload = {
        "left_eye": {"sph": -1.50, "cyl": -0.50, "axis": 90},
        "right_eye": {"sph": -2.00, "cyl": 0.00, "axis": None},
    }
    response = client.post("/api/validate-prescription", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["overall_status"] == "VALID"
    assert data["left_eye"]["status"] == "VALID"
    assert data["right_eye"]["status"] == "VALID"
    assert data["total_errors"] == 0


def test_api_scheduler_status_and_trigger(client):
    """Test autonomous scheduler status and trigger endpoints."""
    # Test status endpoint
    response = client.get("/api/scheduler/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_running" in data
    assert data["interval_seconds"] == 30
    assert "history" in data

    # Test trigger endpoint
    trigger_resp = client.post("/api/scheduler/trigger")
    assert trigger_resp.status_code == 200
    record = trigger_resp.json()
    assert record["status"] in ("SUCCESS", "FAILED")
    assert "latency_ms" in record
    assert "run_id" in record

    # Check updated history
    status_resp = client.get("/api/scheduler/status")
    data_after = status_resp.json()
    assert len(data_after["history"]) >= 1
    assert data_after["history"][0]["run_id"] == record["run_id"]
