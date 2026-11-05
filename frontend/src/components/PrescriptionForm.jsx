import React, { useState } from 'react';
import { Check, AlertCircle, RefreshCw, Sparkles, Send, HelpCircle } from 'lucide-react';

const SAMPLE_PRESETS = [
  {
    label: "Spec Example (OD SPH 25.00 Exceeds Max)",
    description: "OD SPH is 25.00 (> +20.00 max limit) - Left eye is valid",
    data: {
      left_eye: { sph: "-2.50", cyl: "-1.00", axis: "180" },
      right_eye: { sph: "25.00", cyl: "-0.75", axis: "90" },
    },
  },
  {
    label: "Fully Valid Prescription",
    description: "Clinically plausible bilateral prescription within normal bounds",
    data: {
      left_eye: { sph: "-2.50", cyl: "-1.00", axis: "180" },
      right_eye: { sph: "-1.75", cyl: "-0.50", axis: "90" },
    },
  },
  {
    label: "Pure Sphere (Zero CYL, No Axis)",
    description: "Valid spherical prescription with 0.00 CYL and null Axis",
    data: {
      left_eye: { sph: "+1.50", cyl: "0.00", axis: "" },
      right_eye: { sph: "+2.00", cyl: "0.00", axis: "" },
    },
  },
  {
    label: "Violation: Zero CYL with Axis",
    description: "CYL is 0.00 but Axis is provided (violates rule)",
    data: {
      left_eye: { sph: "-3.00", cyl: "0.00", axis: "90" },
      right_eye: { sph: "-2.50", cyl: "0.00", axis: "" },
    },
  },
  {
    label: "Violation: Non-Zero CYL Missing Axis",
    description: "Astigmatic CYL present (-1.25) but Axis is left empty",
    data: {
      left_eye: { sph: "-1.50", cyl: "-1.25", axis: "" },
      right_eye: { sph: "-2.00", cyl: "-0.75", axis: "45" },
    },
  },
  {
    label: "Violation: Axis Out of Bounds (195° & -5°)",
    description: "Axis outside permitted [0°, 180°] range on both eyes",
    data: {
      left_eye: { sph: "-2.00", cyl: "-1.00", axis: "-5" },
      right_eye: { sph: "-2.00", cyl: "-1.00", axis: "195" },
    },
  },
  {
    label: "Compound: Both Eyes Invalid",
    description: "Multiple simultaneous violations across both eyes",
    data: {
      left_eye: { sph: "30.00", cyl: "-15.00", axis: "210" },
      right_eye: { sph: "-26.00", cyl: "14.00", axis: "-15" },
    },
  },
];

export default function PrescriptionForm({
  formData,
  setFormData,
  validationResult,
  onValidate,
  onReset,
  loading,
}) {
  const [showPresets, setShowPresets] = useState(false);

  const handleChange = (eye, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [eye]: {
        ...prev[eye],
        [field]: value,
      },
    }));
  };

  const handleApplyPreset = (preset) => {
    setFormData(preset.data);
    setShowPresets(false);
  };

  // Helper to get field error from validation result
  const getFieldError = (eyeKey, fieldName) => {
    if (!validationResult || !validationResult[eyeKey]) return null;
    const errors = validationResult[eyeKey].errors || [];
    const match = errors.find((e) => e.field.toLowerCase() === fieldName.toLowerCase());
    return match ? match.message : null;
  };

  // Helper to determine field styling state
  const getFieldState = (eyeKey, fieldName) => {
    if (!validationResult || !validationResult[eyeKey]) return 'neutral';
    const hasError = getFieldError(eyeKey, fieldName) !== null;
    return hasError ? 'invalid' : 'valid';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 lg:p-8">
      {/* Title & Presets Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Prescription Entry Form</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter bilateral clinical prescription values for Left Eye (OS) and Right Eye (OD).
          </p>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-semibold border border-teal-200/70 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Load Sample Data</span>
          </button>

          {showPresets && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Test Prescription Preset
              </div>
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex flex-col group"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                    {preset.label}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Eye Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        {/* Left Eye (OS) Card */}
        <EyeCard
          eyeKey="left_eye"
          eyeCode="OS"
          eyeName="Left Eye (Oculus Sinister)"
          data={formData.left_eye}
          onChange={handleChange}
          validationResult={validationResult?.left_eye}
          getFieldState={getFieldState}
          getFieldError={getFieldError}
        />

        {/* Right Eye (OD) Card */}
        <EyeCard
          eyeKey="right_eye"
          eyeCode="OD"
          eyeName="Right Eye (Oculus Dexter)"
          data={formData.right_eye}
          onChange={handleChange}
          validationResult={validationResult?.right_eye}
          getFieldState={getFieldState}
          getFieldError={getFieldError}
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition-all border border-slate-200/60 shadow-xs disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onValidate}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/25 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Validating with Backend...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Validate Prescription</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EyeCard({
  eyeKey,
  eyeCode,
  eyeName,
  data,
  onChange,
  validationResult,
  getFieldState,
  getFieldError,
}) {
  const isEyeValid = validationResult && validationResult.status === 'VALID';
  const isEyeInvalid = validationResult && validationResult.status === 'INVALID';

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-5 ${
        isEyeInvalid
          ? 'border-red-200 bg-red-50/20'
          : isEyeValid
          ? 'border-emerald-200 bg-emerald-50/20'
          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
      }`}
    >
      {/* Eye Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
            {eyeCode}
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{eyeName}</h3>
            <span className="text-[11px] text-slate-500">Configurable range verification</span>
          </div>
        </div>

        {/* Status Badge */}
        {validationResult && (
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 ${
              isEyeValid
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {isEyeValid ? <Check className="w-3 h-3 stroke-[3]" /> : <AlertCircle className="w-3 h-3 stroke-[3]" />}
            <span>{validationResult.status}</span>
          </span>
        )}
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {/* SPH Input */}
        <InputField
          label="SPH (Sphere)"
          hint="Negative or positive decimal [-20.00 to +20.00]"
          unit="D"
          placeholder="e.g. -2.50"
          value={data.sph}
          onChange={(val) => onChange(eyeKey, 'sph', val)}
          state={getFieldState(eyeKey, 'sph')}
          error={getFieldError(eyeKey, 'sph')}
        />

        {/* CYL Input */}
        <InputField
          label="CYL (Cylinder)"
          hint="Negative or positive decimal [-10.00 to +10.00]"
          unit="D"
          placeholder="e.g. -1.00 or 0.00"
          value={data.cyl}
          onChange={(val) => onChange(eyeKey, 'cyl', val)}
          state={getFieldState(eyeKey, 'cyl')}
          error={getFieldError(eyeKey, 'cyl')}
        />

        {/* Axis Input */}
        <InputField
          label="Axis"
          hint="Integer [0° to 180°] (Mandatory if CYL ≠ 0; leave blank if CYL = 0)"
          unit="°"
          placeholder="e.g. 180"
          value={data.axis}
          onChange={(val) => onChange(eyeKey, 'axis', val)}
          state={getFieldState(eyeKey, 'axis')}
          error={getFieldError(eyeKey, 'axis')}
        />
      </div>
    </div>
  );
}

function InputField({ label, hint, unit, placeholder, value, onChange, state, error }) {
  const isInvalid = state === 'invalid';
  const isValid = state === 'valid';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
          <span>{label}</span>
          {isValid && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
          {isInvalid && <AlertCircle className="w-3.5 h-3.5 text-red-600 stroke-[3]" />}
        </label>
        <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
      </div>

      <div className="relative rounded-xl shadow-xs">
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 text-xs font-mono font-medium rounded-xl border transition-all focus:outline-none focus:ring-2 ${
            isInvalid
              ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-200'
              : isValid
              ? 'border-emerald-400 bg-emerald-50/20 text-emerald-950 focus:border-emerald-500 focus:ring-emerald-200'
              : 'border-slate-200 bg-white text-slate-900 focus:border-teal-500 focus:ring-teal-100'
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-[11px] font-bold text-slate-400">{unit}</span>
        </div>
      </div>

      {/* Field Hint */}
      <p className="text-[10.5px] text-slate-400 mt-1">{hint}</p>

      {/* Field Error Message */}
      {isInvalid && error && (
        <div className="mt-1.5 flex items-start space-x-1.5 text-red-600 bg-red-50/80 border border-red-200/80 px-2.5 py-1.5 rounded-lg text-[11px] font-medium animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
