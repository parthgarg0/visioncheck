"""Unit tests for the Eye Prescription Validator module."""

import json
from pathlib import Path
import pytest
from validator import validate_eye, validate_prescription, DEFAULT_LIMITS


def test_valid_prescription():
    """Test a standard valid prescription for both eyes."""
    payload = {
        "left_eye": {"sph": -2.50, "cyl": -1.00, "axis": 180},
        "right_eye": {"sph": -1.75, "cyl": -0.50, "axis": 90},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "VALID"
    assert result.total_errors == 0
    assert result.left_eye.status == "VALID"
    assert result.right_eye.status == "VALID"
    assert len(result.left_eye.errors) == 0
    assert len(result.right_eye.errors) == 0


def test_sph_below_minimum():
    """Test SPH value strictly below -20.00 diopters."""
    payload = {
        "left_eye": {"sph": -20.25, "cyl": -1.00, "axis": 90},
        "right_eye": {"sph": -2.00, "cyl": 0.0, "axis": None},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert result.left_eye.status == "INVALID"
    assert result.right_eye.status == "VALID"
    assert any(err.field == "sph" and "below minimum" in err.message for err in result.left_eye.errors)


def test_sph_above_maximum():
    """Test SPH value strictly above +20.00 diopters."""
    payload = {
        "left_eye": {"sph": -2.50, "cyl": -1.00, "axis": 180},
        "right_eye": {"sph": 25.00, "cyl": -0.75, "axis": 90},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert result.left_eye.status == "VALID"
    assert result.right_eye.status == "INVALID"
    assert any(err.field == "sph" and "exceeds maximum" in err.message for err in result.right_eye.errors)


def test_cyl_below_minimum():
    """Test CYL value strictly below -10.00 diopters."""
    payload = {
        "left_eye": {"sph": -2.00, "cyl": -10.50, "axis": 90},
        "right_eye": {"sph": -2.00, "cyl": -1.00, "axis": 90},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert any(err.field == "cyl" and "below minimum" in err.message for err in result.left_eye.errors)


def test_cyl_above_maximum():
    """Test CYL value strictly above +10.00 diopters."""
    payload = {
        "left_eye": {"sph": -2.00, "cyl": 10.25, "axis": 90},
        "right_eye": {"sph": -2.00, "cyl": 0.0, "axis": None},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert any(err.field == "cyl" and "exceeds maximum" in err.message for err in result.left_eye.errors)


def test_axis_below_zero():
    """Test Axis value below 0 degrees."""
    payload = {
        "left_eye": {"sph": -2.00, "cyl": -1.00, "axis": -1},
        "right_eye": {"sph": -2.00, "cyl": -1.00, "axis": 90},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert any(err.field == "axis" and "between 0 and 180" in err.message for err in result.left_eye.errors)


def test_axis_above_180():
    """Test Axis value above 180 degrees."""
    payload = {
        "left_eye": {"sph": -2.00, "cyl": -1.00, "axis": 90},
        "right_eye": {"sph": -2.00, "cyl": -1.00, "axis": 185},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert any(err.field == "axis" and "between 0 and 180" in err.message for err in result.right_eye.errors)


def test_missing_fields():
    """Test missing SPH, CYL, or entire eye payload."""
    # SPH missing in Left, CYL missing in Right
    payload = {
        "left_eye": {"cyl": -1.00, "axis": 90},
        "right_eye": {"sph": -2.00, "axis": 90},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert any(err.field == "sph" and "required" in err.message for err in result.left_eye.errors)
    assert any(err.field == "cyl" and "required" in err.message for err in result.right_eye.errors)

    # Missing entire left_eye
    payload_missing_eye = {"right_eye": {"sph": -2.00, "cyl": 0.0, "axis": None}}
    res_eye = validate_prescription(payload_missing_eye)
    assert res_eye.left_eye.status == "INVALID"
    assert any(err.field == "general" for err in res_eye.left_eye.errors)


def test_non_numeric_input():
    """Test non-numeric strings passed for SPH, CYL, or Axis."""
    payload = {
        "left_eye": {"sph": "not-a-number", "cyl": -1.00, "axis": 90},
        "right_eye": {"sph": -2.00, "cyl": "bad", "axis": "forty-five"},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert any(err.field == "sph" and "numeric" in err.message for err in result.left_eye.errors)
    assert any(err.field == "cyl" and "numeric" in err.message for err in result.right_eye.errors)
    assert any(err.field == "axis" and "integer" in err.message for err in result.right_eye.errors)


def test_zero_cyl_with_axis():
    """Test rule: Axis must be omitted or null when CYL is 0.00."""
    payload = {
        "left_eye": {"sph": -2.00, "cyl": 0.00, "axis": 90},  # Invalid: has axis
        "right_eye": {"sph": -2.00, "cyl": 0.00, "axis": None},  # Valid: axis omitted
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert result.left_eye.status == "INVALID"
    assert result.right_eye.status == "VALID"
    assert any(
        err.field == "axis" and "omitted or null when CYL is 0.00" in err.message
        for err in result.left_eye.errors
    )


def test_nonzero_cyl_without_axis():
    """Test rule: Axis must be provided when CYL is non-zero."""
    payload = {
        "left_eye": {"sph": -2.00, "cyl": -1.50, "axis": None},  # Missing axis
        "right_eye": {"sph": -2.00, "cyl": 1.50, "axis": ""},  # Empty axis
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert any(err.field == "axis" and "Axis is required" in err.message for err in result.left_eye.errors)
    assert any(err.field == "axis" and "Axis is required" in err.message for err in result.right_eye.errors)


def test_both_eyes_invalid_simultaneously():
    """Test that errors from both eyes are returned together without short-circuiting."""
    payload = {
        "left_eye": {"sph": 30.00, "cyl": -15.00, "axis": 250},
        "right_eye": {"sph": -30.00, "cyl": 15.00, "axis": -10},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "INVALID"
    assert result.left_eye.status == "INVALID"
    assert result.right_eye.status == "INVALID"
    assert len(result.left_eye.errors) >= 3
    assert len(result.right_eye.errors) >= 3
    assert result.total_errors >= 6


def test_boundary_values():
    """Test exact boundary values (-20.00, +20.00, -10.00, +10.00, 0, 180)."""
    payload = {
        "left_eye": {"sph": -20.00, "cyl": -10.00, "axis": 0},
        "right_eye": {"sph": 20.00, "cyl": 10.00, "axis": 180},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "VALID"
    assert result.total_errors == 0


def test_string_numeric_inputs():
    """Test that numbers passed as strings (e.g. from HTML form inputs) are correctly parsed."""
    payload = {
        "left_eye": {"sph": "-2.50", "cyl": "-1.00", "axis": "180"},
        "right_eye": {"sph": "+3.75", "cyl": "0.00", "axis": ""},
    }
    result = validate_prescription(payload)
    assert result.overall_status == "VALID"
    assert result.total_errors == 0
