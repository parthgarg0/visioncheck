# VisionCheck — Eye Prescription Validation System

A clinical-grade, bilateral eye prescription validation service and dashboard built with **React + Vite + Tailwind CSS**, **Python + FastAPI + Pydantic**, and **APScheduler**.

---

## 1. Problem Statement & Architecture

VisionCheck validates ophthalmic prescription inputs for both eyes:
- **Left Eye (OS — Oculus Sinister)**: Sphere (SPH), Cylinder (CYL), Axis
- **Right Eye (OD — Oculus Dexter)**: Sphere (SPH), Cylinder (CYL), Axis

The service ensures inputs fall within configurable, clinically plausible boundaries, strictly validates astigmatism cylinder-axis correlations, and returns all field-specific errors aggregated in a single response.

### High-Level Architecture
```
┌────────────────────────────────────────────────────────┐
│                   React + Vite Dashboard               │
│  - Bilateral Input Form (OS / OD)                      │
│  - Real-time Field Highlighting (Green/Red)            │
│  - Error Breakdown & Summary                           │
│  - Live Autonomous Monitoring Telemetry & History      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│                   FastAPI Backend                      │
│  - POST /api/validate-prescription                     │
│  - GET  /api/validation-rules                          │
│  - GET  /api/health                                    │
│  - GET  /api/scheduler/status                          │
│  - POST /api/scheduler/trigger                         │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Validator Engine      │ │    APScheduler Worker     │
│  - Plausibility Boundaries│ │  - Runs every 30 seconds  │
│  - Cylinder-Axis Logic    │ │  - Verifies golden cases  │
│  - Aggregated Diagnostics │ │  - Logs latency & history │
└───────────────────────────┘ └───────────────────────────┘
```

---

## 2. Configurable Validation Rules

| Field | Minimum | Maximum | Step | Format | Mandatory? | Business Rule |
|---|---:|---:|---:|---|---|---|
| **SPH (Sphere)** | -20.00 D | +20.00 D | 0.25 D | Decimal | Yes | Negative (myopia) or positive (hyperopia). Out-of-bounds rejected. |
| **CYL (Cylinder)** | -10.00 D | +10.00 D | 0.25 D | Decimal | Yes | Astigmatism power. Negative or positive decimal permitted. |
| **Axis** | 0° | 180° | 1° | Integer | Conditional | **Required if CYL ≠ 0**. **Must be omitted/null if CYL = 0.00**. |

### Additional Business & Validation Logic
1. **Numeric Enforcement**: Non-numeric values (e.g. `"abc"`, `"high"`) are rejected with field-specific errors.
2. **Astigmatism Correlation**:
   - If `CYL ≠ 0`, `Axis` is strictly required between 0° and 180°.
   - If `CYL = 0.00`, `Axis` must be omitted or null (no astigmatic meridian).
3. **Independent Eye Evaluation**: Both eyes are validated independently; errors in one eye do not mask issues in the other.
4. **Aggregated Error Reporting**: The engine never short-circuits on the first error; all errors are returned simultaneously.
5. **Clinical Scope Notice**: These software validation bounds verify plausible software input ranges to prevent data-entry blunders, and do not constitute a medical diagnosis or certification.

---

## 3. Autonomous Execution Monitoring Service (APScheduler)

VisionCheck includes a **background monitoring service** powered by **APScheduler** that runs independently after application startup:
1. **Execution Interval**: Every **30 seconds** (`IntervalTrigger(seconds=30)`).
2. **Autonomous Verification**: Sends golden test suites (both valid and out-of-range prescriptions) through the validation engine.
3. **Response Verification**: Verifies that valid inputs return `VALID` and invalid inputs trigger expected error counts.
4. **Telemetry Logging**: Captures run ID, ISO timestamp, execution duration in milliseconds, status (`SUCCESS` / `FAILED`), and diagnostic message.
5. **Frontend Dashboard**:
   - Displays the latest execution status and latency.
   - Shows the next scheduled execution time.
   - Maintains an execution history table showing the latest runs.
   - Includes an on-demand trigger button (`POST /api/scheduler/trigger`) to verify execution immediately.

---

## 4. API Endpoints & Schemas

### POST `/api/validate-prescription`
Validates bilateral eye prescription data.

#### Request Example:
```json
{
  "left_eye": {
    "sph": -2.50,
    "cyl": -1.00,
    "axis": 180
  },
  "right_eye": {
    "sph": 25.00,
    "cyl": -0.75,
    "axis": 90
  }
}
```

#### Response Example:
```json
{
  "success": true,
  "overall_status": "INVALID",
  "left_eye": {
    "status": "VALID",
    "errors": []
  },
  "right_eye": {
    "status": "INVALID",
    "errors": [
      {
        "field": "sph",
        "message": "SPH value 25.00 exceeds maximum allowed value of +20.00."
      }
    ]
  },
  "total_errors": 1,
  "disclaimer": "These limits represent configurable software input validation rules, not universal clinical standards or medical certification."
}
```

### Other Endpoints
- `GET /api/health` — System status, uptime, service metadata.
- `GET /api/validation-rules` — Active limits, boundary parameters, and rule documentation.
- `GET /api/scheduler/status` — Live APScheduler status, next run time, and run history.
- `POST /api/scheduler/trigger` — Trigger immediate autonomous health check execution.
- `GET /docs` — Interactive Swagger UI documentation.

---

## 5. Directory Structure

```
visioncheck/
  backend/
    .venv/
    tests/
      test_validator.py
      test_api.py
      sample_prescriptions.json
    main.py
    models.py
    validator.py
    scheduler.py
    requirements.txt
    pytest.ini
  frontend/
    src/
      components/
        Header.jsx
        PrescriptionForm.jsx
        ValidationResults.jsx
        SchedulerMonitor.jsx
        ValidationRulesModal.jsx
      App.jsx
      main.jsx
      index.css
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
  README.md
```

---

## 6. How to Run

### Backend Setup & Execution
```bash
cd visioncheck/backend
# Activate virtual environment
.\.venv\Scripts\Activate.ps1
# Run tests
pytest tests -v
# Start FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`

### Frontend Setup & Execution
```bash
cd visioncheck/frontend
npm install
npm run dev
```
- Frontend Web App: `http://127.0.0.1:5173`

---

## 7. Automated Test Suite (Pytest)

All 19 test cases passed:
- `test_valid_prescription`: Valid bilateral prescription passes.
- `test_sph_below_minimum`: SPH < -20.00 rejected.
- `test_sph_above_maximum`: SPH > +20.00 rejected.
- `test_cyl_below_minimum`: CYL < -10.00 rejected.
- `test_cyl_above_maximum`: CYL > +10.00 rejected.
- `test_axis_below_zero`: Axis < 0 rejected.
- `test_axis_above_180`: Axis > 180 rejected.
- `test_missing_fields`: Missing SPH/CYL/eye objects identified.
- `test_non_numeric_input`: Non-numeric string inputs rejected.
- `test_zero_cyl_with_axis`: Axis present when CYL = 0.00 rejected.
- `test_nonzero_cyl_without_axis`: Non-zero CYL missing axis rejected.
- `test_both_eyes_invalid_simultaneously`: Compound errors returned across both eyes.
- `test_boundary_values`: Exact minimum and maximum limits permitted.
- `test_string_numeric_inputs`: String numbers correctly parsed.
- `test_api_health`: Health endpoint integration verified.
- `test_api_validation_rules`: Rules endpoint metadata verified.
- `test_api_validate_prescription_spec_example`: Spec sample verified.
- `test_api_validate_valid_prescription`: API valid case verified.
- `test_api_scheduler_status_and_trigger`: Scheduler telemetry and trigger verified.

---

## 8. Known Limitations
- The validation engine checks input plausibility within configurable optical manufacturing bounds; it does not check pupil distance (PD) or multifocal ADD values (which can be added as modular extensions).
- Axis values require integers from 0 to 180 degrees per standard optical tabulating conventions.
