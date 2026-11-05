import React from 'react';
import { Eye, Activity, FileText, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Header({ backendOnline, onOpenRules, onScrollToMonitor }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20 text-white">
            <Eye className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">VisionCheck</h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Eye Prescription Validation System</p>
          </div>
        </div>

        {/* Status Indicator & Quick Actions */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Status Indicator: System Online */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              {backendOnline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              )}
            </span>
            <span className="font-semibold text-slate-700">
              {backendOnline ? 'System Online' : 'Connecting...'}
            </span>
          </div>

          {/* Rules Button */}
          <button
            onClick={onOpenRules}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="View Configurable Clinical Rules"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="hidden md:inline font-medium">Validation Rules</span>
          </button>

          {/* Autonomous Monitor Jump */}
          <button
            onClick={onScrollToMonitor}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors border border-transparent hover:border-teal-200"
            title="View Autonomous APScheduler Monitor"
          >
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="hidden md:inline font-medium">Auto-Monitor (30s)</span>
          </button>

          {/* Swagger Link */}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
}
