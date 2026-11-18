import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';

export default function Settings() {
  const [weights, setWeights] = useState({
    semantic_weight: 35.0,
    skill_weight: 30.0,
    experience_weight: 15.0,
    education_weight: 10.0,
    project_weight: 10.0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadWeights = async () => {
    try {
      setLoading(true);
      const data = await api.getWeights();
      setWeights(data);
    } catch (err) {
      console.error('Failed to load weights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeights();
  }, []);

  const total = (
    weights.semantic_weight +
    weights.skill_weight +
    weights.experience_weight +
    weights.education_weight +
    weights.project_weight
  );

  const isValid = Math.abs(total - 100.0) < 0.1;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setErrorMsg(`Total weights must equal exactly 100%. Currently: ${total.toFixed(1)}%`);
      return;
    }
    try {
      setSaving(true);
      setStatusMsg('');
      setErrorMsg('');
      await api.updateWeights(weights);
      setStatusMsg('Matching weights updated successfully! Future match calculations will use these weights.');
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    if (preset === 'default') {
      setWeights({
        semantic_weight: 35.0,
        skill_weight: 30.0,
        experience_weight: 15.0,
        education_weight: 10.0,
        project_weight: 10.0,
      });
    } else if (preset === 'tech') {
      setWeights({
        semantic_weight: 20.0,
        skill_weight: 50.0,
        experience_weight: 15.0,
        education_weight: 5.0,
        project_weight: 10.0,
      });
    } else if (preset === 'seniority') {
      setWeights({
        semantic_weight: 25.0,
        skill_weight: 25.0,
        experience_weight: 35.0,
        education_weight: 10.0,
        project_weight: 5.0,
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          AI Matching Engine Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Adjust the relative importance of each algorithmic matching dimension to fit your organization's hiring priorities.
        </p>
      </div>

      {/* Preset Quick Selection */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Industry Weighting Presets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="font-bold text-slate-900 text-xs">Standard Balanced (Default)</div>
            <div className="text-[11px] text-slate-500 mt-1">35% Semantic, 30% Skills, 15% Exp, 10% Edu, 10% Proj</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('tech')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="font-bold text-slate-900 text-xs">Technical Skills Heavy</div>
            <div className="text-[11px] text-slate-500 mt-1">50% Skills, 20% Semantic, 15% Exp, 10% Proj, 5% Edu</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('seniority')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="font-bold text-slate-900 text-xs">Seniority & Leadership</div>
            <div className="text-[11px] text-slate-500 mt-1">35% Experience, 25% Skills, 25% Semantic, 10% Edu, 5% Proj</div>
          </button>
        </div>
      </div>

      {/* Weight Sliders Card */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Configurable Weight Sliders</h3>
            <p className="text-xs text-slate-500">Total allocation across all 5 dimensions must sum to 100%.</p>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isValid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
          >
            Total: {total.toFixed(1)}% {isValid ? '✓' : '(Must be 100%)'}
          </div>
        </div>

        {statusMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Dimension 1: Semantic Similarity */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">1. Semantic Similarity (Sentence Transformers & TF-IDF)</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {weights.semantic_weight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="1"
              value={weights.semantic_weight}
              onChange={(e) => setWeights({ ...weights, semantic_weight: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">
              Measures contextual embedding similarity between candidate resume text and job description narrative.
            </p>
          </div>

          {/* Dimension 2: Technical Skills */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">2. Technical Skill Match</span>
              <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {weights.skill_weight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="1"
              value={weights.skill_weight}
              onChange={(e) => setWeights({ ...weights, skill_weight: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">
              Evaluates exact and alias matches against core required and preferred technology skills.
            </p>
          </div>

          {/* Dimension 3: Experience */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">3. Experience Duration & Seniority</span>
              <span className="font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {weights.experience_weight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={weights.experience_weight}
              onChange={(e) => setWeights({ ...weights, experience_weight: parseFloat(e.target.value) })}
              className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">
              Compares candidate career duration against minimum target years specified for the role.
            </p>
          </div>

          {/* Dimension 4: Education */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">4. Education Level Qualification</span>
              <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {weights.education_weight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={weights.education_weight}
              onChange={(e) => setWeights({ ...weights, education_weight: parseFloat(e.target.value) })}
              className="w-full accent-amber-600 h-2 bg-slate-100 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">
              Degree level alignment (Doctorate, Master's, Bachelor's, Associate) with job specifications.
            </p>
          </div>

          {/* Dimension 5: Projects & Certifications */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">5. Projects & Professional Certifications</span>
              <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {weights.project_weight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={weights.project_weight}
              onChange={(e) => setWeights({ ...weights, project_weight: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">
              Hands-on practical application in personal/work projects and relevant industry certifications.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => applyPreset('default')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <button
              type="submit"
              disabled={saving || !isValid}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

