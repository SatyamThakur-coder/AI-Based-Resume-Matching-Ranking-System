import React from 'react';
import { X, CheckCircle, AlertCircle, ArrowRight, Award, GraduationCap, Briefcase } from 'lucide-react';
import ScoreBadge from './ScoreBadge';
import SkillTag from './SkillTag';

export default function CandidateCompareModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { job, candidates } = data;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-navy-900 to-navy-800 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded border border-blue-400/30">
                Candidate Comparison Matrix
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">
              Evaluating Against: {job?.title || 'Selected Job'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table / Columns */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Target Role Highlights */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Min Experience:</span>{' '}
              {job?.min_experience_years} Years
            </div>
            <div>
              <span className="font-semibold text-slate-900">Education Target:</span>{' '}
              {job?.education_required}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-900">Core Required Skills:</span>
              {job?.required_skills?.map((s) => (
                <SkillTag key={s} name={s} status="default" size="xs" />
              ))}
            </div>
          </div>

          {/* Side by side columns */}
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(candidates.length, 3)} gap-4`}>
            {candidates.map((cand, idx) => (
              <div
                key={cand.candidate_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col space-y-4 hover:border-blue-300 transition-all"
              >
                {/* Header Profile */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Candidate #{idx + 1}
                    </span>
                    {cand.overall_score !== null && (
                      <ScoreBadge score={cand.overall_score} size="md" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{cand.name}</h3>
                  <p className="text-xs text-slate-500">{cand.email || 'No email provided'}</p>
                </div>

                {/* Score Breakdown Bars */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Semantic Alignment:</span>
                    <span className="text-blue-600">{cand.semantic_score?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${cand.semantic_score || 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Technical Skills:</span>
                    <span className="text-emerald-600">{cand.skill_score?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${cand.skill_score || 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Experience Match:</span>
                    <span className="text-purple-600">{cand.experience_score?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full"
                      style={{ width: `${cand.experience_score || 0}%` }}
                    />
                  </div>
                </div>

                {/* Experience & Education */}
                <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-xs border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      <b>{cand.experience_years?.toFixed(1)}</b> Years Total Experience
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate" title={cand.education_details || cand.education_level}>
                      {cand.education_level}
                    </span>
                  </div>
                </div>

                {/* Matched Skills */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Matched Skills ({cand.matched_skills?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {cand.matched_skills?.length > 0 ? (
                      cand.matched_skills.map((s) => (
                        <SkillTag key={s} name={s} status="matched" size="xs" />
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None matched</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Missing Skills ({cand.missing_skills?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {cand.missing_skills?.length > 0 ? (
                      cand.missing_skills.map((s) => (
                        <SkillTag key={s} name={s} status="missing" size="xs" />
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">None! Full skill coverage.</span>
                    )}
                  </div>
                </div>

                {/* AI Summary */}
                {cand.explanation?.summary && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed italic bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                    "{cand.explanation.summary}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}

