import React, { useEffect, useState } from 'react';
import {
  FileText,
  Briefcase,
  Users,
  Target,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import MetricCard from '../components/MetricCard';
import ScoreBadge from '../components/ScoreBadge';
import SkillTag from '../components/SkillTag';
import { api } from '../api/client';

export default function Dashboard({ setActiveTab, setSelectedCandidateId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardAnalytics();
      setStats(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Aggregating recruitment metrics...</p>
        </div>
      </div>
    );
  }

  const CHART_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-950 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Talent Intelligence
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome to AI TalentMatch
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Screen candidate resumes against customizable job descriptions. Calculate objective semantic, technical skill, and experience scores with explainable AI breakdowns.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('upload')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Upload Resumes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              Manage Job Descriptions
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className="px-4 py-2 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white font-semibold text-xs border border-indigo-400/30 transition-all flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>View Match Rankings</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Resumes"
          value={stats?.total_resumes || 0}
          subtitle="Processed candidates in talent pool"
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="Job Descriptions"
          value={stats?.total_jobs || 0}
          subtitle="Active recruitment requisitions"
          icon={Briefcase}
          color="indigo"
        />
        <MetricCard
          title="Candidates Analyzed"
          value={stats?.total_candidates_analyzed || 0}
          subtitle="Evaluated across roles"
          icon={Users}
          color="emerald"
        />
        <MetricCard
          title="Avg Matching Score"
          value={`${stats?.average_matching_score || 0}%`}
          subtitle="Weighted cross-candidate average"
          icon={Target}
          color="amber"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top In-Demand Skills vs Talent Pool */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Talent Pool Skill Distribution</h3>
              <p className="text-xs text-slate-500">Most frequent technical competencies extracted from resumes</p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full">
            {stats?.top_skills_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top_skills_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis dataKey="skill" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '10px', color: '#FFF', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No skill data available. Upload resumes or load demo data to view charts.
              </div>
            )}
          </div>
        </div>

        {/* Score Brackets Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Candidate Score Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of matching scores across evaluated candidates</p>
            </div>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full">
            {stats?.candidate_score_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.candidate_score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '10px', color: '#FFF', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  />
                  <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]}>
                    {stats.candidate_score_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No match evaluations run yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Ranked Candidates Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Top-Ranked Candidates</h3>
            <p className="text-xs text-slate-500">Highest matching applicants from recent evaluations</p>
          </div>
          <button
            onClick={() => setActiveTab('rankings')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Full Rankings Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.top_candidates?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.top_candidates.map((cand, idx) => (
              <div
                key={cand.id || idx}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-sm shrink-0 border border-slate-200">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{cand.candidate_name}</h4>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{cand.candidate_education}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cand.candidate_experience_years?.toFixed(1)} years experience • {cand.candidate_email}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cand.matched_skills?.slice(0, 5).map((s) => (
                        <SkillTag key={s} name={s} status="matched" size="xs" />
                      ))}
                      {cand.matched_skills?.length > 5 && (
                        <span className="text-[11px] text-slate-400 self-center">
                          +{cand.matched_skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                  <ScoreBadge score={cand.overall_score} size="md" />
                  <button
                    onClick={() => {
                      if (setSelectedCandidateId) setSelectedCandidateId(cand.candidate_id);
                      setActiveTab('profile');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    View Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            No candidate evaluations recorded yet. Upload resumes and run the matching engine to see top talent.
          </div>
        )}
      </div>

      {/* Recent Recruitment Activity */}
      {stats?.recent_activity?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Recruitment Activity</h3>
          </div>
          <div className="space-y-3">
            {stats.recent_activity.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-none">
                <div>
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="text-slate-500">{item.subtitle}</p>
                </div>
                <span className="text-slate-400 font-medium">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

