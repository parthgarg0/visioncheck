from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class FieldError(BaseModel):
    field: str = Field(..., description="The name of the field with error (sph, cyl, axis, or general)")
    message: str = Field(..., description="Human-readable descriptive error message")


class EyeInput(BaseModel):
    sph: Optional[Any] = Field(None, description="Sphere value (negative or positive decimal)")
    cyl: Optional[Any] = Field(None, description="Cylinder value (negative or positive decimal)")
    axis: Optional[Any] = Field(None, description="Axis value (integer between 0 and 180)")


class PrescriptionInput(BaseModel):
    left_eye: Optional[Any] = Field(None, description="Left Eye (OS - Oculus Sinister) prescription")
    right_eye: Optional[Any] = Field(None, description="Right Eye (OD - Oculus Dexter) prescription")


class EyeValidationResult(BaseModel):
    status: str = Field(..., description="VALID or INVALID")
    errors: List[FieldError] = Field(default_factory=list, description="List of field-specific errors")


class PrescriptionValidationResponse(BaseModel):
    success: bool = Field(True, description="Indicates the request was processed successfully")
    overall_status: str = Field(..., description="Overall prescription validity: VALID or INVALID")
    left_eye: EyeValidationResult = Field(..., description="Validation result for left eye")
    right_eye: EyeValidationResult = Field(..., description="Validation result for right eye")
    total_errors: int = Field(..., description="Total number of validation errors across both eyes")
    disclaimer: Optional[str] = Field(
        default="These limits represent configurable software input validation rules, not universal clinical standards or medical certification.",
        description="Software boundary and clinical disclaimer"
    )


class ValidationRuleLimits(BaseModel):
    sph_min: float = -20.00
    sph_max: float = 20.00
    sph_step: float = 0.25
    cyl_min: float = -10.00
    cyl_max: float = 10.00
    cyl_step: float = 0.25
    axis_min: int = 0
    axis_max: int = 180
    axis_step: int = 1


class ValidationRulesResponse(BaseModel):
    limits: ValidationRuleLimits
    rules: List[str]
    disclaimer: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    uptime_seconds: float


class SchedulerRunRecord(BaseModel):
    run_id: str
    timestamp: str
    status: str
    latency_ms: float
    test_case: str
    expected_status: str
    actual_status: str
    message: str


class SchedulerStatusResponse(BaseModel):
    is_running: bool
    interval_seconds: int
    total_runs: int
    successful_runs: int
    failed_runs: int
    latest_run: Optional[SchedulerRunRecord] = None
    next_run_time: Optional[str] = None
    history: List[SchedulerRunRecord] = Field(default_factory=list)
