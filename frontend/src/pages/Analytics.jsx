import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Award,
  Users,
  Briefcase
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
  Pie,
  Legend
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { api } from '../api/client';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getDashboardAnalytics();
        setStats(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-xs text-slate-400">Loading talent analytics...</div>
      </div>
    );
  }

  const PIE_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Recruitment & Talent Intelligence Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Deep-dive analysis of candidate competencies, skill demand gaps, and score distributions.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          title="Talent Pool Size"
          value={stats?.total_resumes || 0}
          subtitle="Parsed candidate profiles"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Requisitions Covered"
          value={stats?.total_jobs || 0}
          subtitle="Open engineering positions"
          icon={Briefcase}
          color="indigo"
        />
        <MetricCard
          title="Average Candidate Fit"
          value={`${stats?.average_matching_score || 0}%`}
          subtitle="Multi-factor weighted average"
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Candidate Skills */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Technical Skills in Talent Pool</h3>
              <p className="text-xs text-slate-500">Frequency of technical keywords extracted across all resumes</p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-72 w-full">
            {stats?.top_skills_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top_skills_distribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '10px', color: '#FFF', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No skill distribution data available.
              </div>
            )}
          </div>
        </div>

        {/* Most Demanded Skills from Job Descriptions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Job Requirements Demand</h3>
              <p className="text-xs text-slate-500">Most requested skills specified in active job postings</p>
            </div>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>

          <div className="h-72 w-full">
            {stats?.top_in_demand_skills?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top_in_demand_skills} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '10px', color: '#FFF', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  />
                  <Bar dataKey="demand_count" fill="#4F46E5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No job demand data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Bracket Pie / Tier Distribution */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Applicant Score Tier Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution of evaluated candidates across score tiers</p>
          </div>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <Layers className="w-4 h-4" />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="h-64 md:col-span-1">
            {stats?.candidate_score_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.candidate_score_distribution}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {stats.candidate_score_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '10px', color: '#FFF', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No scores recorded.
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-3">
            {stats?.candidate_score_distribution?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="font-bold text-slate-800">{item.range} Match Tier</span>
                </div>
                <span className="font-extrabold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  {item.count} Candidate(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

