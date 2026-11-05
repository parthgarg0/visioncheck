"""VisionCheck - Eye Prescription Validation Service.

FastAPI application providing:
- POST /api/validate-prescription
- GET  /api/health
- GET  /api/validation-rules
- GET  /api/scheduler/status
- POST /api/scheduler/trigger
- Swagger UI /docs
"""

import datetime
import time
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import Body, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    HealthResponse,
    PrescriptionValidationResponse,
    SchedulerRunRecord,
    SchedulerStatusResponse,
    ValidationRulesResponse,
)
from scheduler import (
    get_scheduler_status,
    start_scheduler,
    stop_scheduler,
    trigger_immediate_run,
)
from validator import get_validation_rules_info, validate_prescription

APP_START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle startup and shutdown events."""
    # Startup: Launch the autonomous validation scheduler
    start_scheduler()
    yield
    # Shutdown: Cleanly terminate scheduler
    stop_scheduler()


app = FastAPI(
    title="VisionCheck API",
    description="Eye Prescription Clinical Plausibility & Range Validation Service with Autonomous Monitoring",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for React frontend (Vite dev server default 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """System health check endpoint."""
    uptime = round(time.time() - APP_START_TIME, 2)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return HealthResponse(
        status="healthy",
        service="VisionCheck API",
        version="1.0.0",
        timestamp=now_iso,
        uptime_seconds=uptime,
    )


@app.get("/api/validation-rules", response_model=ValidationRulesResponse, tags=["Rules"])
async def get_validation_rules():
    """Retrieve the current configurable validation ranges and rule policies."""
    return get_validation_rules_info()


@app.post(
    "/api/validate-prescription",
    response_model=PrescriptionValidationResponse,
    tags=["Validation"],
)
async def validate_prescription_endpoint(payload: Any = Body(...)):
    """Validate a bilateral eye prescription (Left Eye OS and Right Eye OD).

    Evaluates SPH, CYL, Axis against configurable plausibility limits
    and cylinder-axis correlation rules. Returns all validation errors together.
    """
    return validate_prescription(payload)


@app.get(
    "/api/scheduler/status",
    response_model=SchedulerStatusResponse,
    tags=["Autonomous Monitoring"],
)
async def get_scheduler_status_endpoint():
    """Retrieve the live status and execution history of the autonomous background scheduler."""
    return get_scheduler_status()


@app.post(
    "/api/scheduler/trigger",
    response_model=SchedulerRunRecord,
    tags=["Autonomous Monitoring"],
)
async def trigger_scheduler_check():
    """Trigger an immediate run of the autonomous health monitor."""
    return trigger_immediate_run()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
