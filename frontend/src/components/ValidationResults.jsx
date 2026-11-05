import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Check, X, Info } from 'lucide-react';

export default function ValidationResults({ result, formData }) {
  if (!result) return null;

  const isOverallValid = result.overall_status === 'VALID';
  const totalErrors = result.total_errors ?? 0;

  // Aggregate all errors
  const leftErrors = result.left_eye?.errors || [];
  const rightErrors = result.right_eye?.errors || [];
  const allErrors = [
    ...leftErrors.map((e) => ({ ...e, eye: 'Left Eye (OS)' })),
    ...rightErrors.map((e) => ({ ...e, eye: 'Right Eye (OD)' })),
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 1. Overall Status Banner */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isOverallValid
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-300/80 text-emerald-950'
            : 'bg-gradient-to-r from-red-50 via-rose-50/50 to-white border-red-300/80 text-red-950'
        }`}
      >
        <div className="flex items-start sm:items-center space-x-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isOverallValid
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-red-600 text-white shadow-red-500/20'
            }`}
          >
            {isOverallValid ? (
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            ) : (
              <XCircle className="w-7 h-7 stroke-[2.2]" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall Validation Status
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isOverallValid
                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                    : 'bg-red-200 text-red-900 border border-red-300'
                }`}
              >
                {result.overall_status}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              {isOverallValid
                ? 'Prescription Plausible & Clinically Consistent'
                : `Validation Failed — ${totalErrors} Plausibility Violation${totalErrors === 1 ? '' : 's'} Found`}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isOverallValid
                ? 'All entered sphere, cylinder, and axis values adhere to configurable clinical bounds.'
                : 'Please review and correct the highlighted fields before submitting to optical manufacturing.'}
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/50">
          <span className="text-[11px] font-semibold text-slate-500">Total Errors</span>
          <span
            className={`text-2xl font-mono font-black ${
              isOverallValid ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {totalErrors}
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Eye Breakdown Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Eye Breakdown */}
        <EyeBreakdownCard
          title="Left Eye (OS)"
          code="OS"
          eyeStatus={result.left_eye?.status}
          errors={leftErrors}
          data={formData.left_eye}
        />

        {/* Right Eye Breakdown */}
        <EyeBreakdownCard
          title="Right Eye (OD)"
          code="OD"
          eyeStatus={result.right_eye?.status}
          errors={rightErrors}
          data={formData.right_eye}
        />
      </div>

      {/* 3. Summary of all validation errors */}
      {allErrors.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-red-100">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Aggregated Validation Error Summary ({allErrors.length})
            </h4>
          </div>
          <ul className="space-y-2.5">
            {allErrors.map((err, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-3 p-3 rounded-xl bg-red-50/60 border border-red-200/70 text-xs"
              >
                <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{err.eye}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-800 uppercase font-semibold">
                      Field: {err.field}
                    </span>
                  </div>
                  <p className="text-red-800 font-medium mt-1">{err.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Clinical & Software Disclaimer */}
      <div className="bg-slate-100/70 rounded-xl border border-slate-200 p-4 flex items-start space-x-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 font-semibold">Regulatory Notice: </strong>
          {result.disclaimer ||
            'These limits check plausible software input ranges to prevent data entry anomalies and do not certify a clinical medical prescription.'}
        </p>
      </div>
    </div>
  );
}

function EyeBreakdownCard({ title, code, eyeStatus, errors, data }) {
  const isValid = eyeStatus === 'VALID';
  const getFieldErr = (field) => errors.find((e) => e.field.toLowerCase() === field.toLowerCase());

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xs bg-white ${
        isValid ? 'border-emerald-200' : 'border-red-200'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
            {code}
          </span>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isValid
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {eyeStatus}
        </span>
      </div>

      {/* Field status chips */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        <ValueBadge
          field="SPH"
          value={data?.sph}
          error={getFieldErr('sph')}
        />
        <ValueBadge
          field="CYL"
          value={data?.cyl}
          error={getFieldErr('cyl')}
        />
        <ValueBadge
          field="Axis"
          value={data?.axis || (data?.cyl === '0.00' || data?.cyl === '0' ? 'None' : '')}
          error={getFieldErr('axis')}
        />
      </div>

      {/* Errors specific to this eye */}
      {errors.length > 0 && (
        <div className="space-y-1.5 mt-3 pt-3 border-t border-red-100">
          {errors.map((err, i) => (
            <div key={i} className="text-[11px] text-red-700 flex items-start space-x-1.5 font-medium">
              <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ValueBadge({ field, value, error }) {
  const isErr = !!error;
  const displayVal = value !== undefined && value !== null && value !== '' ? value : '—';

  return (
    <div
      className={`p-2.5 rounded-xl border text-center transition-all ${
        isErr
          ? 'bg-red-50/80 border-red-300 text-red-950'
          : 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center space-x-1">
        <span>{field}</span>
        {isErr ? (
          <X className="w-3 h-3 text-red-600 stroke-[3]" />
        ) : (
          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
        )}
      </div>
      <div className={`text-xs font-mono font-bold mt-1 ${isErr ? 'text-red-700' : 'text-slate-900'}`}>
        {displayVal}
      </div>
      <div className="text-[9px] font-semibold mt-0.5 uppercase tracking-wide">
        <span className={isErr ? 'text-red-600' : 'text-emerald-700'}>
          {isErr ? 'Invalid' : 'Valid'}
        </span>
      </div>
    </div>
  );
}
