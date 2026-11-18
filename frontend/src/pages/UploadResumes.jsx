import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  Trash2,
  Eye,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import SkillTag from '../components/SkillTag';
import { api } from '../api/client';

export default function UploadResumes({ setActiveTab, setSelectedCandidateId }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setUploadResult(null);
      const res = await api.uploadResumes(files);
      setUploadResult(res);
      await loadCandidates();
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove candidate "${name}"?`)) return;
    try {
      await api.deleteCandidate(id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Upload & Parse Resumes
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload candidate resumes in PDF, DOCX, or TXT format. AI extracts skills, experience years, education, and contact data automatically.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-slate-50/50 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            {uploading ? (
              <RefreshCw className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7 stroke-[2]" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {uploading ? 'Parsing and extracting resumes...' : 'Click to upload or drag & drop files here'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports multiple PDF, DOCX, and TXT files (batch processing enabled)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Automated NLP Extraction Engine
          </span>
        </div>
      </div>

      {/* Upload Feedback Banner */}
      {uploadResult && (
        <div
          className={`p-5 rounded-2xl border ${
            uploadResult.failed_count === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              Processed {uploadResult.uploaded_count} resume(s) successfully!
            </span>
          </div>

          {uploadResult.errors?.length > 0 && (
            <div className="mt-3 text-xs space-y-1 text-rose-700">
              <p className="font-semibold">Some files could not be parsed:</p>
              {uploadResult.errors.map((e, idx) => (
                <p key={idx}>• {e.filename}: {e.error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Talent Pool Review Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Extracted Candidates ({candidates.length})
            </h2>
            <p className="text-xs text-slate-500">
              Review extracted structured data, skills, and background details.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, skill, education..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading talent database...</div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No candidates found. Upload resumes or click "Load Sample Data" above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCandidates.map((cand) => (
              <div
                key={cand.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-400 transition-all flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cand.name}</h3>
                      <p className="text-xs text-slate-500">{cand.email || 'No email provided'}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(cand.id, cand.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {cand.total_experience_years?.toFixed(1)} yrs exp
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {cand.education_level}
                    </span>
                  </div>

                  {/* Skills preview */}
                  <div className="mt-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Extracted Skills ({cand.skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cand.skills.slice(0, 6).map((s) => (
                        <SkillTag key={s} name={s} status="default" size="xs" />
                      ))}
                      {cand.skills.length > 6 && (
                        <span className="text-[11px] text-slate-400 self-center">
                          +{cand.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Added {new Date(cand.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      if (setSelectedCandidateId) setSelectedCandidateId(cand.id);
                      setActiveTab('profile');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Full Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

