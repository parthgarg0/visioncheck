import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import PrescriptionForm from './components/PrescriptionForm';
import ValidationResults from './components/ValidationResults';
import SchedulerMonitor from './components/SchedulerMonitor';
import ValidationRulesModal from './components/ValidationRulesModal';

const INITIAL_FORM = {
  left_eye: { sph: "-2.50", cyl: "-1.00", axis: "180" },
  right_eye: { sph: "25.00", cyl: "-0.75", axis: "90" },
};

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesData, setRulesData] = useState(null);
  const [schedulerData, setSchedulerData] = useState(null);
  const [schedulerTriggering, setSchedulerTriggering] = useState(false);

  const monitorRef = useRef(null);

  // Poll backend health & scheduler status
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/validation-rules');
      if (res.ok) {
        const data = await res.json();
        setRulesData(data);
      }
    } catch (err) {
      console.error('Failed to load validation rules', err);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch('/api/scheduler/status');
      if (res.ok) {
        const data = await res.json();
        setSchedulerData(data);
      }
    } catch (err) {
      console.error('Failed to load scheduler telemetry', err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchRules();
    fetchSchedulerStatus();

    // Regular polling interval: 4 seconds for scheduler & health updates
    const interval = setInterval(() => {
      fetchHealth();
      fetchSchedulerStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleValidate = async () => {
    setLoading(true);
    try {
      // Clean up values: convert empty strings to null or preserve numbers
      const payload = {
        left_eye: {
          sph: formData.left_eye.sph === "" ? null : formData.left_eye.sph,
          cyl: formData.left_eye.cyl === "" ? null : formData.left_eye.cyl,
          axis: formData.left_eye.axis === "" ? null : formData.left_eye.axis,
        },
        right_eye: {
          sph: formData.right_eye.sph === "" ? null : formData.right_eye.sph,
          cyl: formData.right_eye.cyl === "" ? null : formData.right_eye.cyl,
          axis: formData.right_eye.axis === "" ? null : formData.right_eye.axis,
        },
      };

      const res = await fetch('/api/validate-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
      } else {
        const errText = await res.text();
        console.error('Validation API error:', errText);
      }
    } catch (err) {
      console.error('Failed to submit validation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      left_eye: { sph: '', cyl: '', axis: '' },
      right_eye: { sph: '', cyl: '', axis: '' },
    });
    setValidationResult(null);
  };

  const handleTriggerScheduler = async () => {
    setSchedulerTriggering(true);
    try {
      const res = await fetch('/api/scheduler/trigger', { method: 'POST' });
      if (res.ok) {
        await fetchSchedulerStatus();
      }
    } catch (err) {
      console.error('Failed to trigger scheduler check:', err);
    } finally {
      setSchedulerTriggering(false);
    }
  };

  const scrollToMonitor = () => {
    const el = document.getElementById('scheduler-monitor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <Header
        backendOnline={backendOnline}
        onOpenRules={() => setRulesModalOpen(true)}
        onScrollToMonitor={scrollToMonitor}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro Hero Strip */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
              <span>FastAPI + React Optometry Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Clinical Eye Prescription Validation & Monitoring
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Real-time bilateral validation for Sphere (SPH), Cylinder (CYL), and Axis.
              Enforces clinical boundary rules, astigmatism correlation constraints, and
              operates an autonomous 30-second APScheduler health-check service.
            </p>
          </div>
          {/* Subtle gradient orb */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* 1. Prescription Input Form */}
        <PrescriptionForm
          formData={formData}
          setFormData={setFormData}
          validationResult={validationResult}
          onValidate={handleValidate}
          onReset={handleReset}
          loading={loading}
        />

        {/* 2. Validation Results Section */}
        {validationResult && (
          <ValidationResults
            result={validationResult}
            formData={formData}
          />
        )}

        {/* 3. Autonomous Execution Monitoring Section (MANDATORY) */}
        <SchedulerMonitor
          schedulerData={schedulerData}
          onTriggerRun={handleTriggerScheduler}
          triggering={schedulerTriggering}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VisionCheck &copy; 2026. Clinical Eye Prescription Validation System.</span>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>FastAPI: <code className="text-slate-600 font-mono">127.0.0.1:8000</code></span>
            <span>Vite: <code className="text-slate-600 font-mono">127.0.0.1:5173</code></span>
            <span>APScheduler: <span className="text-teal-600 font-semibold">Active (30s)</span></span>
          </div>
        </div>
      </footer>

      {/* Rules Modal */}
      <ValidationRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        rulesData={rulesData}
      />
    </div>
  );
}
