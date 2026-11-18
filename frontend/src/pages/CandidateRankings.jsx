import React, { useState, useEffect } from 'react';
import {
  Award,
  Play,
  FileDown,
  Filter,
  Search,
  CheckSquare,
  Square,
  Users,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ArrowUpDown,
  Download
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import SkillTag from '../components/SkillTag';
import CandidateCompareModal from '../components/CandidateCompareModal';
import { api } from '../api/client';

export default function CandidateRankings({
  selectedJobId,
  setSelectedJobId,
  setActiveTab,
  setSelectedCandidateId,
}) {
  const [jobs, setJobs] = useState([]);
  const [currentJobId, setCurrentJobId] = useState(selectedJobId || null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchingRunning, setMatchingRunning] = useState(false);

  // Filters & sorting
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minExp, setMinExp] = useState(0);
  const [sortBy, setSortBy] = useState('overall_score');
  const [sortOrder, setSortOrder] = useState('desc');

  // Candidate comparison selection
  const [selectedCandidatesForCompare, setSelectedCandidatesForCompare] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareData, setCompareData] = useState(null);

  // Load available jobs
  useEffect(() => {
    async function initJobs() {
      try {
        const jobsList = await api.getJobs();
        setJobs(jobsList);
        if (!currentJobId && jobsList.length > 0) {
          const defaultId = selectedJobId || jobsList[0].id;
          setCurrentJobId(defaultId);
        }
      } catch (err) {
        console.error('Failed to load jobs list:', err);
      }
    }
    initJobs();
  }, [selectedJobId]);

  // Load rankings whenever currentJobId or filters change
  const loadRankings = async (jobId) => {
    if (!jobId) return;
    try {
      setLoading(true);
      const data = await api.getRankings(jobId, {
        min_score: minScore,
        min_exp: minExp,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setRankings(data);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentJobId) {
      loadRankings(currentJobId);
    }
  }, [currentJobId, minScore, minExp, sortBy, sortOrder]);

  const handleRunMatch = async () => {
    if (!currentJobId) return;
    try {
      setMatchingRunning(true);
      await api.runMatching(currentJobId);
      await loadRankings(currentJobId);
    } catch (err) {
      alert(`Matching failed: ${err.message}`);
    } finally {
      setMatchingRunning(false);
    }
  };

  const toggleSelectCandidate = (candId) => {
    setSelectedCandidatesForCompare((prev) => {
      if (prev.includes(candId)) {
        return prev.filter((id) => id !== candId);
      } else {
        if (prev.length >= 4) {
          alert('You can compare a maximum of 4 candidates at once.');
          return prev;
        }
        return [...prev, candId];
      }
    });
  };

  const handleOpenCompare = async () => {
    if (selectedCandidatesForCompare.length < 2) {
      alert('Please select at least 2 candidates to compare.');
      return;
    }
    try {
      const res = await api.compareCandidates(currentJobId, selectedCandidatesForCompare);
      setCompareData(res);
      setCompareModalOpen(true);
    } catch (err) {
      alert(`Comparison failed: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    if (!currentJobId) return;
    window.open(api.getCsvExportUrl(currentJobId), '_blank');
  };

  const handleExportPdf = () => {
    if (!currentJobId) return;
    window.open(api.getPdfExportUrl(currentJobId), '_blank');
  };

  const currentJob = jobs.find((j) => j.id === Number(currentJobId));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Candidate Matching & Rankings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-dimensional weighted ranking calculated from resume content and job requisitions.
          </p>
        </div>

        {/* Job Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={currentJobId || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentJobId(val);
              if (setSelectedJobId) setSelectedJobId(val);
              setSelectedCandidatesForCompare([]);
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunMatch}
            disabled={matchingRunning || !currentJobId}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {matchingRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{matchingRunning ? 'Calculating Scores...' : 'Run Matching Engine'}</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={handleExportCsv}
            disabled={rankings.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={rankings.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
            title="Download formatted recruitment PDF report"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Target Job Overview Card */}
      {currentJob && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Target Requisition
              </span>
              <h3 className="text-base font-bold text-slate-900">{currentJob.title}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Min Experience: <b>{currentJob.min_experience_years} Years</b> • Target Education: <b>{currentJob.education_required}</b>
            </p>
            <div className="flex flex-wrap gap-1 mt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 self-center">
                Required Skills:
              </span>
              {currentJob.required_skills?.map((s) => (
                <SkillTag key={s} name={s} status="default" size="xs" />
              ))}
            </div>
          </div>

          {selectedCandidatesForCompare.length >= 2 && (
            <button
              onClick={handleOpenCompare}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0 animate-bounce"
            >
              <Users className="w-4 h-4" />
              <span>Compare Selected ({selectedCandidatesForCompare.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Filters & Sorting Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRankings(currentJobId)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Min Score:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24 accent-blue-600"
            />
            <span className="font-bold text-slate-800 w-8">{minScore}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Min Exp:</span>
            <select
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="0">Any Exp</option>
              <option value="2">2+ Years</option>
              <option value="4">4+ Years</option>
              <option value="6">6+ Years</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
          >
            <option value="overall_score">Overall Match Score</option>
            <option value="skill_score">Technical Skill Match</option>
            <option value="semantic_score">Semantic Alignment</option>
            <option value="experience_years">Years Experience</option>
          </select>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Toggle Sort Direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Candidate Rankings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading match rankings...
          </div>
        ) : rankings.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-3">
            <Award className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No match records found for this job description.</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Click the blue "Run Matching Engine" button to evaluate candidate resumes against this job specification.
            </p>
            <button
              onClick={handleRunMatch}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:bg-blue-700"
            >
              Run Matching Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 text-center">Compare</th>
                  <th className="py-3.5 px-4 w-16">Rank</th>
                  <th className="py-3.5 px-4">Candidate Name</th>
                  <th className="py-3.5 px-4">Overall Score</th>
                  <th className="py-3.5 px-4">Semantic</th>
                  <th className="py-3.5 px-4">Skills</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Matched Skills</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankings.map((r, idx) => {
                  const isSelected = selectedCandidatesForCompare.includes(r.candidate_id);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* Checkbox for comparison */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleSelectCandidate(r.candidate_id)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Rank badge */}
                      <td className="py-3 px-4 font-bold text-slate-600">
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-[11px] font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'text-slate-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>

                      {/* Candidate Name & Sub info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.candidate_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {r.candidate_education} • {r.candidate_email}
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td className="py-3 px-4">
                        <ScoreBadge score={r.overall_score} size="md" />
                      </td>

                      {/* Semantic Score */}
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {r.semantic_score?.toFixed(1)}%
                      </td>

                      {/* Skills Score */}
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {r.skill_score?.toFixed(1)}%
                      </td>

                      {/* Experience Score */}
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {r.candidate_experience_years?.toFixed(1)} yrs
                        </span>
                        <div className="text-[10px] text-slate-400">
                          ({r.experience_score?.toFixed(0)}% fit)
                        </div>
                      </td>

                      {/* Matched Skills */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {r.matched_skills?.slice(0, 3).map((s) => (
                            <SkillTag key={s} name={s} status="matched" size="xs" />
                          ))}
                          {r.matched_skills?.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{r.matched_skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (setSelectedCandidateId) setSelectedCandidateId(r.candidate_id);
                            setActiveTab('profile');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold text-[11px] transition-colors"
                        >
                          Deep Dive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      <CandidateCompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        data={compareData}
      />
    </div>
  );
}

