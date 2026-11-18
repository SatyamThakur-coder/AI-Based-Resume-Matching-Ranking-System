import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Layers,
  FileText,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import ScoreBadge from '../components/ScoreBadge';
import SkillTag from '../components/SkillTag';
import { api } from '../api/client';

export default function CandidateProfile({
  candidateId,
  selectedJobId,
  setActiveTab,
}) {
  const [candidate, setCandidate] = useState(null);
  const [candidatesList, setCandidatesList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [activeJobId, setActiveJobId] = useState(selectedJobId || null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  // Load all candidates and jobs
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cList, jList] = await Promise.all([
          api.getCandidates(),
          api.getJobs()
        ]);
        setCandidatesList(cList);
        setJobsList(jList);
        if (jList.length > 0 && !activeJobId) {
          setActiveJobId(jList[0].id);
        }
      } catch (err) {
        console.error('Meta load error:', err);
      }
    }
    loadMeta();
  }, []);

  // Load candidate details
  useEffect(() => {
    async function loadCand() {
      if (!candidateId && candidatesList.length > 0) {
        setCandidate(candidatesList[0]);
        return;
      }
      if (candidateId) {
        try {
          setLoading(true);
          const data = await api.getCandidate(candidateId);
          setCandidate(data);
        } catch (err) {
          console.error('Candidate fetch error:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadCand();
  }, [candidateId, candidatesList]);

  // Load or run match for this candidate against activeJobId
  useEffect(() => {
    async function fetchMatch() {
      if (!candidate?.id || !activeJobId) return;
      try {
        setEvaluating(true);
        // Try getting existing match first
        try {
          const match = await api.getCandidateMatch(candidate.id, activeJobId);
          setMatchResult(match);
        } catch {
          // If not matched yet, run matching for this candidate
          const runRes = await api.runMatching(activeJobId, [candidate.id]);
          if (runRes?.length > 0) {
            setMatchResult(runRes[0]);
          }
        }
      } catch (err) {
        console.error('Match evaluation failed:', err);
      } finally {
        setEvaluating(false);
      }
    }
    fetchMatch();
  }, [candidate?.id, activeJobId]);

  if (!candidate && loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-xs text-slate-400">Loading candidate profile...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800">No Candidate Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select a candidate from the Rankings or Upload page to inspect their detailed profile.</p>
        <button
          onClick={() => setActiveTab('rankings')}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Go to Rankings
        </button>
      </div>
    );
  }

  const radarData = matchResult
    ? [
        { subject: 'Semantic Fit', score: matchResult.semantic_score || 0, fullMark: 100 },
        { subject: 'Tech Skills', score: matchResult.skill_score || 0, fullMark: 100 },
        { subject: 'Experience', score: matchResult.experience_score || 0, fullMark: 100 },
        { subject: 'Education', score: matchResult.education_score || 0, fullMark: 100 },
        { subject: 'Projects/Certs', score: matchResult.project_score || 0, fullMark: 100 },
      ]
    : [];

  const explanation = matchResult?.explanation || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Bar with Candidate Switcher & Job Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => setActiveTab('rankings')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Rankings</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Target Job Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Evaluating Against:</span>
            <select
              value={activeJobId || ''}
              onChange={(e) => setActiveJobId(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            >
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hero Profile Header */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20 shrink-0">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {candidate.name}
              </h1>
              {matchResult && (
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {explanation.tier || 'Evaluated'}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              {candidate.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.email}
                </span>
              )}
              {candidate.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.phone}
                </span>
              )}
              {candidate.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.location}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {candidate.total_experience_years?.toFixed(1)} Years Industry Experience
              </span>
              <span>•</span>
              <span>{candidate.education_details || candidate.education_level}</span>
            </div>
          </div>
        </div>

        {/* Overall Match Badge Card */}
        {matchResult && (
          <div className="flex flex-col items-end shrink-0 self-start lg:self-center bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Final Weighted Match
            </span>
            <ScoreBadge score={matchResult.overall_score} size="xl" showLabel={false} />
            <span className="text-[11px] text-slate-500 mt-1 font-medium">
              Based on configurable algorithm weights
            </span>
          </div>
        )}
      </div>

      {/* Explainable AI Analysis & Component Scores */}
      {matchResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar / Component Scores Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Score Dimension Radar</h3>
              </div>
              <p className="text-[11px] text-slate-500">5-axis algorithmic suitability assessment</p>
            </div>

            <div className="h-64 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Candidate Score"
                    dataKey="score"
                    stroke="#2563EB"
                    fill="#3B82F6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Semantic:</span>
                <span className="font-bold text-slate-800">{matchResult.semantic_score?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Technical Skills:</span>
                <span className="font-bold text-slate-800">{matchResult.skill_score?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Experience:</span>
                <span className="font-bold text-slate-800">{matchResult.experience_score?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Education:</span>
                <span className="font-bold text-slate-800">{matchResult.education_score?.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Explainable AI Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Explainable AI Match Assessment</h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Transparent rationale explaining candidate strengths and improvement opportunities
              </p>

              {/* Summary quote */}
              <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 font-medium leading-relaxed italic">
                "{explanation.summary}"
              </div>

              {/* Strengths and Gaps */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Strengths */}
                <div className="rounded-xl bg-emerald-50/50 border border-emerald-200 p-4">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Key Candidate Strengths
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {explanation.strengths?.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps / Areas to Explore */}
                <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-4">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Identified Gaps & Interview Topics
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {explanation.improvement_areas?.length > 0 ? (
                      explanation.improvement_areas.map((gap, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{gap}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-emerald-700 font-medium">No critical skill or experience deficiencies identified.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills Pills */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  Matched Skills ({matchResult.matched_skills?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchResult.matched_skills?.map((s) => (
                    <SkillTag key={s} name={s} status="matched" size="xs" />
                  ))}
                </div>
              </div>

              {matchResult.missing_skills?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mb-1.5">
                    Missing Target Skills ({matchResult.missing_skills?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {matchResult.missing_skills?.map((s) => (
                      <SkillTag key={s} name={s} status="missing" size="xs" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Projects, Experience & Certifications Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experience Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Professional Experience Records</h3>
          </div>

          {candidate.experiences?.length > 0 ? (
            <div className="space-y-4">
              {candidate.experiences.map((exp, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <h4 className="font-bold text-slate-900">{exp.title}</h4>
                  <p className="text-slate-500 text-[11px]">{exp.company}</p>
                  <p className="mt-2 text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No detailed experience breakdown available.
            </div>
          )}
        </div>

        {/* Projects & Certifications */}
        <div className="space-y-6">
          {/* Projects */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Extracted Projects</h3>
            </div>

            {candidate.projects?.length > 0 ? (
              <div className="space-y-3">
                {candidate.projects.map((proj, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <h4 className="font-bold text-slate-900">{proj.title}</h4>
                    <p className="mt-1 text-slate-600 leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No distinct projects identified.
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Certifications & Accreditations</h3>
            </div>

            {candidate.certifications?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {candidate.certifications.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-lg"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No professional certifications listed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

