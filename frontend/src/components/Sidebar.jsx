import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Briefcase,
  Award,
  BarChart3,
  Sliders,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Resumes', icon: UploadCloud },
    { id: 'jobs', label: 'Job Descriptions', icon: Briefcase },
    { id: 'rankings', label: 'Candidate Rankings', icon: Award },
    { id: 'profile', label: 'Candidate Profile', icon: UserCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Algorithm Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-800 flex flex-col shrink-0 select-none min-h-screen text-slate-300">
      {/* Brand Logo Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-navy-800 bg-navy-900/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Sparkles className="w-5 h-5 fill-white/20" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-none">
            AI TalentMatch
          </h1>
          <p className="text-[10px] uppercase font-semibold text-blue-400 tracking-wider mt-1">
            Intelligent Screening
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-navy-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 m-3 rounded-xl bg-navy-800/70 border border-navy-700/60 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI Engine Ready</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Transformer embeddings active. Semantic similarity powered by MiniLM.
        </p>
      </div>
    </aside>
  );
}

