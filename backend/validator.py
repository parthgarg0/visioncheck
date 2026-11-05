"""Eye Prescription Validator Module for VisionCheck.

Implements clinical plausibility rules and configurable boundary checks:
- SPH: -20.00 to +20.00 diopters (numeric, decimals permitted)
- CYL: -10.00 to +10.00 diopters (numeric, decimals permitted)
- Axis: 0 to 180 degrees inclusive (integers only)
- Non-zero CYL requires an Axis value
- Zero CYL requires Axis to be omitted or null
- Missing required fields, non-numeric values, and out-of-range values produce specific errors
- Both eyes (Left/OS and Right/OD) are validated independently
- All validation errors are gathered simultaneously (no early exit)
"""

import math
from typing import Any, Dict, List, Optional, Tuple, Union
from models import (
    FieldError,
    EyeValidationResult,
    PrescriptionValidationResponse,
    ValidationRuleLimits,
    ValidationRulesResponse,
)

# Default configurable validation limits
DEFAULT_LIMITS = ValidationRuleLimits()

RULES_DOCUMENTATION = [
    f"SPH (Sphere) must be numeric between {DEFAULT_LIMITS.sph_min:+.2f} and {DEFAULT_LIMITS.sph_max:+.2f} diopters (decimals supported).",
    f"CYL (Cylinder) must be numeric between {DEFAULT_LIMITS.cyl_min:+.2f} and {DEFAULT_LIMITS.cyl_max:+.2f} diopters (decimals supported).",
    f"Axis must be an integer between {DEFAULT_LIMITS.axis_min} and {DEFAULT_LIMITS.axis_max} degrees inclusive.",
    "Axis is mandatory when CYL is non-zero (indicating astigmatic correction).",
    "Axis must be omitted or null when CYL is 0.00 (no cylindrical correction needed).",
    "SPH and CYL are required fields for each eye.",
    "Non-numeric values, malformed inputs, and out-of-range figures are rejected with field-specific errors.",
    "Both Left Eye (OS) and Right Eye (OD) are evaluated independently.",
    "All errors across both eyes are aggregated in the response.",
]

DISCLAIMER_TEXT = (
    "These validation limits represent configurable software input validation rules "
    "to ensure data plausibility and entry accuracy. They are not universal clinical standards "
    "and do not certify or diagnose any eye health condition."
)


def is_empty_value(val: Any) -> bool:
    """Check if a value is considered empty/omitted."""
    if val is None:
        return True
    if isinstance(val, str) and val.strip() == "":
        return True
    return False


def parse_float(val: Any, field_name: str) -> Tuple[Optional[float], Optional[str]]:
    """Parse a float value, returning (parsed_float, error_message)."""
    if is_empty_value(val):
        return None, f"{field_name} is required."
    try:
        # Check if val is bool (since bool is subclass of int in Python)
        if isinstance(val, bool):
            return None, f"{field_name} must be a valid numeric value."
        f_val = float(val)
        if math.isnan(f_val) or math.isinf(f_val):
            return None, f"{field_name} must be a finite number."
        return f_val, None
    except (ValueError, TypeError):
        return None, f"{field_name} must be a valid numeric value."


def parse_int_axis(val: Any) -> Tuple[Optional[int], Optional[str]]:
    """Parse an integer axis value, returning (parsed_int, error_message)."""
    if is_empty_value(val):
        return None, "Axis is required when CYL is non-zero."
    if isinstance(val, bool):
        return None, "Axis must be an integer between 0 and 180."
    try:
        # If passed as string, check for decimal dot
        if isinstance(val, str):
            val_clean = val.strip()
            if "." in val_clean:
                f_val = float(val_clean)
                if not f_val.is_integer():
                    return None, "Axis must be an integer between 0 and 180."
                return int(f_val), None
            return int(val_clean), None
        elif isinstance(val, float):
            if not val.is_integer():
                return None, "Axis must be an integer between 0 and 180."
            return int(val), None
        elif isinstance(val, int):
            return val, None
        else:
            return None, "Axis must be an integer between 0 and 180."
    except (ValueError, TypeError):
        return None, "Axis must be an integer between 0 and 180."


def validate_eye(
    eye_data: Any,
    eye_name: str = "Eye",
    limits: ValidationRuleLimits = DEFAULT_LIMITS,
) -> EyeValidationResult:
    """Validate a single eye prescription input dictionary."""
    errors: List[FieldError] = []

    if eye_data is None:
        errors.append(
            FieldError(field="general", message=f"{eye_name} prescription data is required.")
        )
        return EyeValidationResult(status="INVALID", errors=errors)

    if not isinstance(eye_data, dict):
        # Could be an EyeInput model
        if hasattr(eye_data, "dict"):
            data = eye_data.dict()
        elif hasattr(eye_data, "model_dump"):
            data = eye_data.model_dump()
        else:
            errors.append(
                FieldError(field="general", message=f"{eye_name} data must be an object/dictionary.")
            )
            return EyeValidationResult(status="INVALID", errors=errors)
    else:
        data = eye_data

    sph_raw = data.get("sph")
    cyl_raw = data.get("cyl")
    axis_raw = data.get("axis")

    # 1. Validate SPH
    sph_val, sph_err = parse_float(sph_raw, "SPH")
    if sph_err:
        errors.append(FieldError(field="sph", message=sph_err))
    else:
        if sph_val < limits.sph_min:
            errors.append(
                FieldError(
                    field="sph",
                    message=f"SPH value {sph_val:.2f} is below minimum allowed value of {limits.sph_min:+.2f}.",
                )
            )
        elif sph_val > limits.sph_max:
            errors.append(
                FieldError(
                    field="sph",
                    message=f"SPH value {sph_val:.2f} exceeds maximum allowed value of {limits.sph_max:+.2f}.",
                )
            )

    # 2. Validate CYL
    cyl_val, cyl_err = parse_float(cyl_raw, "CYL")
    if cyl_err:
        errors.append(FieldError(field="cyl", message=cyl_err))
    else:
        if cyl_val < limits.cyl_min:
            errors.append(
                FieldError(
                    field="cyl",
                    message=f"CYL value {cyl_val:.2f} is below minimum allowed value of {limits.cyl_min:+.2f}.",
                )
            )
        elif cyl_val > limits.cyl_max:
            errors.append(
                FieldError(
                    field="cyl",
                    message=f"CYL value {cyl_val:.2f} exceeds maximum allowed value of {limits.cyl_max:+.2f}.",
                )
            )

    # 3. Validate Axis in combination with CYL
    if cyl_err is None and cyl_val is not None:
        if abs(cyl_val) > 1e-6:
            # CYL is non-zero -> Axis is mandatory
            if is_empty_value(axis_raw):
                errors.append(
                    FieldError(
                        field="axis",
                        message="Axis is required when CYL is non-zero (astigmatism correction).",
                    )
                )
            else:
                axis_val, axis_err = parse_int_axis(axis_raw)
                if axis_err:
                    errors.append(FieldError(field="axis", message=axis_err))
                else:
                    if axis_val < limits.axis_min or axis_val > limits.axis_max:
                        errors.append(
                            FieldError(
                                field="axis",
                                message=f"Axis value {axis_val} must be between {limits.axis_min} and {limits.axis_max} inclusive.",
                            )
                        )
        else:
            # CYL is zero -> Axis must be omitted or null
            if not is_empty_value(axis_raw):
                errors.append(
                    FieldError(
                        field="axis",
                        message="Axis must be omitted or null when CYL is 0.00 (no astigmatism correction).",
                    )
                )
    else:
        # If CYL had an error or wasn't provided, still inspect Axis if provided to catch syntax errors
        if not is_empty_value(axis_raw):
            axis_val, axis_err = parse_int_axis(axis_raw)
            if axis_err:
                errors.append(FieldError(field="axis", message=axis_err))
            elif axis_val is not None and (axis_val < limits.axis_min or axis_val > limits.axis_max):
                errors.append(
                    FieldError(
                        field="axis",
                        message=f"Axis value {axis_val} must be between {limits.axis_min} and {limits.axis_max} inclusive.",
                    )
                )

    status = "VALID" if len(errors) == 0 else "INVALID"
    return EyeValidationResult(status=status, errors=errors)


def validate_prescription(
    prescription: Union[Dict[str, Any], Any],
    limits: ValidationRuleLimits = DEFAULT_LIMITS,
) -> PrescriptionValidationResponse:
    """Validate full bilateral prescription (Left and Right eyes)."""
    if prescription is None:
        left_res = EyeValidationResult(
            status="INVALID",
            errors=[FieldError(field="general", message="Left eye (OS) data is required.")],
        )
        right_res = EyeValidationResult(
            status="INVALID",
            errors=[FieldError(field="general", message="Right eye (OD) data is required.")],
        )
        return PrescriptionValidationResponse(
            success=True,
            overall_status="INVALID",
            left_eye=left_res,
            right_eye=right_res,
            total_errors=2,
            disclaimer=DISCLAIMER_TEXT,
        )

    if hasattr(prescription, "dict"):
        data = prescription.dict()
    elif hasattr(prescription, "model_dump"):
        data = prescription.model_dump()
    elif isinstance(prescription, dict):
        data = prescription
    else:
        left_res = EyeValidationResult(
            status="INVALID",
            errors=[FieldError(field="general", message="Prescription payload must be a JSON object.")],
        )
        right_res = EyeValidationResult(
            status="INVALID",
            errors=[FieldError(field="general", message="Prescription payload must be a JSON object.")],
        )
        return PrescriptionValidationResponse(
            success=True,
            overall_status="INVALID",
            left_eye=left_res,
            right_eye=right_res,
            total_errors=2,
            disclaimer=DISCLAIMER_TEXT,
        )

    left_raw = data.get("left_eye")
    right_raw = data.get("right_eye")

    left_result = validate_eye(left_raw, eye_name="Left Eye (OS)", limits=limits)
    right_result = validate_eye(right_raw, eye_name="Right Eye (OD)", limits=limits)

    total_errors = len(left_result.errors) + len(right_result.errors)
    overall_status = "VALID" if (left_result.status == "VALID" and right_result.status == "VALID") else "INVALID"

    return PrescriptionValidationResponse(
        success=True,
        overall_status=overall_status,
        left_eye=left_result,
        right_eye=right_result,
        total_errors=total_errors,
        disclaimer=DISCLAIMER_TEXT,
    )


def get_validation_rules_info(limits: ValidationRuleLimits = DEFAULT_LIMITS) -> ValidationRulesResponse:
    """Return the rules and configurable limits."""
    return ValidationRulesResponse(
        limits=limits,
        rules=RULES_DOCUMENTATION,
        disclaimer=DISCLAIMER_TEXT,
    )
