import React from 'react';
import { X, ShieldCheck, Check, AlertTriangle, FileText } from 'lucide-react';

export default function ValidationRulesModal({ isOpen, onClose, rulesData }) {
  if (!isOpen) return null;

  const limits = rulesData?.limits || {
    sph_min: -20.0,
    sph_max: 20.0,
    cyl_min: -10.0,
    cyl_max: 10.0,
    axis_min: 0,
    axis_max: 180,
  };

  const rulesList = rulesData?.rules || [
    "SPH must be a numeric value between -20.00 and +20.00 diopters.",
    "CYL must be a numeric value between -10.00 and +10.00 diopters.",
    "Axis must be an integer between 0 and 180 degrees inclusive.",
    "Axis is mandatory when CYL is non-zero (indicates astigmatic power).",
    "Axis must be omitted or null when CYL is 0.00 (no astigmatism).",
    "Missing required fields produce field-specific errors.",
    "Non-numeric values and malformed strings are rejected.",
    "Both eyes (Left OS and Right OD) are evaluated independently.",
    "All errors across both eyes are returned together (no early bailout).",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configurable Validation Rules & Limits
              </h3>
              <p className="text-xs text-slate-500">
                System business policies for eye prescription verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Active Range Boundaries Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Configurable Parameter Boundaries
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Parameter</th>
                    <th className="py-2.5 px-4">Minimum</th>
                    <th className="py-2.5 px-4">Maximum</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-800">SPH (Sphere)</td>
                    <td className="py-2.5 px-4 text-slate-600">{limits.sph_min.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-slate-600">+{limits.sph_max.toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Decimal</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Diopters (D)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-800">CYL (Cylinder)</td>
                    <td className="py-2.5 px-4 text-slate-600">{limits.cyl_min.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-slate-600">+{limits.cyl_max.toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Decimal</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Diopters (D)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-800">Axis</td>
                    <td className="py-2.5 px-4 text-slate-600">{limits.axis_min}</td>
                    <td className="py-2.5 px-4 text-slate-600">{limits.axis_max}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Integer</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Degrees (°)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Rules List */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Validation Business Logic Rules
            </h4>
            <ul className="space-y-2">
              {rulesList.map((rule, idx) => (
                <li key={idx} className="flex items-start space-x-2.5">
                  <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinical Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Clinical Notice: </strong>
              These are configurable software validation limits to prevent system data entry anomalies,
              not universal clinical or medical standards. The system validates plausibility and does not
              diagnose or certify a prescription.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
