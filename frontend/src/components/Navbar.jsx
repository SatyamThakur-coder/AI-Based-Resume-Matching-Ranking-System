import React, { useState } from 'react';
import { Database, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export default function Navbar({ onRefreshData }) {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLoadedMsg, setDemoLoadedMsg] = useState('');

  const handleSeedDemoData = async () => {
    try {
      setLoadingDemo(true);
      await Promise.all([
        api.seedDemoCandidates(),
        api.seedDemoJobs()
      ]);
      setDemoLoadedMsg('Demo candidates & jobs loaded!');
      if (onRefreshData) onRefreshData();
      setTimeout(() => setDemoLoadedMsg(''), 4000);
    } catch (err) {
      alert(`Failed to load demo data: ${err.message}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Recruitment Intelligence Suite
        </h2>
        <p className="text-xs text-slate-500">
          Automated resume parsing, semantic matching, and applicant ranking
        </p>
      </div>

      <div className="flex items-center gap-3">
        {demoLoadedMsg && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {demoLoadedMsg}
          </span>
        )}

        <button
          onClick={handleSeedDemoData}
          disabled={loadingDemo}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
          title="Seed realistic candidates and job descriptions for rapid testing"
        >
          {loadingDemo ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{loadingDemo ? 'Populating...' : 'Load Sample Data'}</span>
        </button>
      </div>
    </header>
  );
}

