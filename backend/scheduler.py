"""Automated Validation Monitoring Service using APScheduler.

Runs independently every 30 seconds after application startup.
Validates sample prescriptions against the validation service,
checks responses against expected outcomes, logs results,
and tracks run history (timestamp, latency, status, next run time).
"""

import datetime
import logging
import threading
import time
import uuid
from typing import List, Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from models import SchedulerRunRecord, SchedulerStatusResponse
from validator import validate_prescription

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("visioncheck.scheduler")

# Thread-safe in-memory state using RLock to prevent any re-entrant deadlocks
_lock = threading.RLock()
_scheduler: Optional[BackgroundScheduler] = None
_run_history: List[SchedulerRunRecord] = []
_total_runs: int = 0
_successful_runs: int = 0
_failed_runs: int = 0
_is_running: bool = False
JOB_ID = "visioncheck_health_monitor"
INTERVAL_SECONDS = 30


# Golden test payloads for autonomous verification
SAMPLE_TEST_SUITE = [
    {
        "name": "Standard Valid Prescription",
        "payload": {
            "left_eye": {"sph": -2.50, "cyl": -1.00, "axis": 180},
            "right_eye": {"sph": -1.75, "cyl": 0.0, "axis": None},
        },
        "expected_overall": "VALID",
        "expected_error_count": 0,
    },
    {
        "name": "Out-of-Bounds SPH & Missing Axis",
        "payload": {
            "left_eye": {"sph": 25.00, "cyl": -0.75, "axis": 90},  # SPH > 20.0
            "right_eye": {"sph": -1.50, "cyl": -2.00, "axis": None},  # CYL non-zero without axis
        },
        "expected_overall": "INVALID",
        "expected_error_count": 2,
    },
]


def run_validation_health_check() -> SchedulerRunRecord:
    """Execute validation health check against the test suite."""
    global _total_runs, _successful_runs, _failed_runs

    start_time = time.perf_counter()
    run_id = f"job-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    passed_tests = 0
    total_tests = len(SAMPLE_TEST_SUITE)
    failure_reasons = []

    try:
        for case in SAMPLE_TEST_SUITE:
            res = validate_prescription(case["payload"])
            if res.overall_status != case["expected_overall"]:
                failure_reasons.append(
                    f"[{case['name']}] expected overall {case['expected_overall']}, got {res.overall_status}"
                )
            elif res.total_errors != case["expected_error_count"]:
                failure_reasons.append(
                    f"[{case['name']}] expected error count {case['expected_error_count']}, got {res.total_errors}"
                )
            else:
                passed_tests += 1

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if passed_tests == total_tests:
            status = "SUCCESS"
            msg = f"All {total_tests}/{total_tests} autonomous test suites verified successfully in {elapsed_ms}ms."
            actual_status = "VALID_AND_ACCURATE"
            logger.info("Autonomous health check [%s]: %s", run_id, msg)
        else:
            status = "FAILED"
            msg = f"Autonomous check failures ({passed_tests}/{total_tests} passed): " + "; ".join(failure_reasons)
            actual_status = "MISMATCH"
            logger.warning("Autonomous health check [%s] FAILED: %s", run_id, msg)

    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        status = "FAILED"
        msg = f"Unexpected error during health check: {str(exc)}"
        actual_status = "EXCEPTION"
        logger.exception("Autonomous health check [%s] EXCEPTION", run_id)

    record = SchedulerRunRecord(
        run_id=run_id,
        timestamp=now_iso,
        status=status,
        latency_ms=elapsed_ms,
        test_case=f"Bilateral Automated Verification ({total_tests} scenarios)",
        expected_status="SUCCESS",
        actual_status=actual_status,
        message=msg,
    )

    with _lock:
        _total_runs += 1
        if status == "SUCCESS":
            _successful_runs += 1
        else:
            _failed_runs += 1
        # Store up to 50 latest records (at least 5 required)
        _run_history.insert(0, record)
        if len(_run_history) > 50:
            _run_history.pop()

    return record


def start_scheduler():
    """Start the APScheduler background monitoring job."""
    global _scheduler, _is_running
    with _lock:
        if _scheduler is not None and _scheduler.running:
            return

        sched = BackgroundScheduler(daemon=True)
        sched.add_job(
            run_validation_health_check,
            trigger=IntervalTrigger(seconds=INTERVAL_SECONDS),
            id=JOB_ID,
            name="Autonomous Eye Prescription Health Check",
            replace_existing=True,
        )
        _scheduler = sched
        _is_running = True

    _scheduler.start()
    logger.info("APScheduler autonomous validation monitoring started (interval: %ds).", INTERVAL_SECONDS)
    # Execute an initial check run so status is instantly populated
    run_validation_health_check()


def stop_scheduler():
    """Shutdown the background scheduler."""
    global _scheduler, _is_running
    with _lock:
        if _scheduler is not None and _scheduler.running:
            _scheduler.shutdown(wait=False)
            _is_running = False
            logger.info("APScheduler stopped.")


def get_scheduler_status() -> SchedulerStatusResponse:
    """Retrieve the current health monitor status and execution history."""
    with _lock:
        next_run_iso = None
        if _scheduler is not None and _scheduler.running:
            job = _scheduler.get_job(JOB_ID)
            if job and job.next_run_time:
                next_run_iso = job.next_run_time.isoformat()

        latest_run = _run_history[0] if _run_history else None

        return SchedulerStatusResponse(
            is_running=_is_running,
            interval_seconds=INTERVAL_SECONDS,
            total_runs=_total_runs,
            successful_runs=_successful_runs,
            failed_runs=_failed_runs,
            latest_run=latest_run,
            next_run_time=next_run_iso,
            history=list(_run_history[:15]),  # Return latest 15 runs
        )


def trigger_immediate_run() -> SchedulerRunRecord:
    """Manually trigger an immediate health check run (does not alter the schedule)."""
    return run_validation_health_check()
