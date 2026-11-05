import React, { useState } from 'react';
import { Activity, Clock, CheckCircle, AlertOctagon, RefreshCw, Zap, PlayCircle, History } from 'lucide-react';

export default function SchedulerMonitor({ schedulerData, onTriggerRun, triggering }) {
  const [pulse, setPulse] = useState(false);

  const isRunning = schedulerData?.is_running;
  const latest = schedulerData?.latest_run;
  const history = schedulerData?.history || [];
  const nextRun = schedulerData?.next_run_time;

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString() + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return isoString;
    }
  };

  const handleManualTrigger = async () => {
    setPulse(true);
    await onTriggerRun();
    setTimeout(() => setPulse(false), 800);
  };

  return (
    <div id="scheduler-monitor" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 lg:p-8 scroll-mt-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Autonomous Validation Monitoring Service
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 uppercase tracking-wider">
                APScheduler
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Backend scheduled autonomous worker executing full validation test suites every 30 seconds.
            </p>
          </div>
        </div>

        {/* Trigger Button & Status Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <span className="relative flex h-2 w-2">
              {isRunning ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              )}
            </span>
            <span className="font-semibold text-slate-700">
              {isRunning ? 'Scheduler Active (30s interval)' : 'Scheduler Inactive'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleManualTrigger}
            disabled={triggering}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50"
            title="Trigger an autonomous run right now"
          >
            {triggering ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>Execute Now</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Latest Run & Next Run */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Latest Execution Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Latest Execution</span>
            </span>
            {latest && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  latest.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {latest.status}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            {latest ? formatDateTime(latest.timestamp) : 'Awaiting initial run...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
            {latest?.message || 'Scheduler initializing...'}
          </p>
        </div>

        {/* Next Scheduled Execution Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold flex items-center space-x-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>Next Scheduled Execution</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">30s Interval</span>
          </div>
          <div className="text-sm font-bold text-teal-700 font-mono">
            {nextRun ? formatDateTime(nextRun) : 'Pending...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Autonomous health check executes automatically every 30s.
          </p>
        </div>

        {/* Run Telemetry Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>Execution Telemetry</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">Live</span>
          </div>
          <div className="flex items-baseline space-x-4">
            <div>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {schedulerData?.total_runs ?? 0}
              </span>
              <span className="text-[11px] text-slate-400 ml-1">total runs</span>
            </div>
            {latest?.latency_ms !== undefined && (
              <div>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {latest.latency_ms}ms
                </span>
                <span className="text-[11px] text-slate-400 ml-1">last latency</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {schedulerData?.successful_runs ?? 0} successful / {schedulerData?.failed_runs ?? 0} failed
          </p>
        </div>
      </div>

      {/* Execution History Table (At least latest 5 runs) */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Autonomous Execution History (Latest {Math.min(history.length, 10)} Runs)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Real-time Auto-refresh</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Waiting for first autonomous execution...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Run ID</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4">Verification Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.slice(0, 10).map((run, idx) => (
                  <tr key={run.run_id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-600 font-semibold text-[11px]">
                      {run.run_id}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {formatTime(run.timestamp)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          run.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {run.status === 'SUCCESS' ? (
                          <CheckCircle className="w-2.5 h-2.5" />
                        ) : (
                          <AlertOctagon className="w-2.5 h-2.5" />
                        )}
                        <span>{run.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {run.latency_ms}ms
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-md truncate" title={run.message}>
                      {run.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
