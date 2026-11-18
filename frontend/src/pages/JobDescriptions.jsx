import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit3,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';
import SkillTag from '../components/SkillTag';
import { api } from '../api/client';

export default function JobDescriptions({ setActiveTab, setSelectedJobId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote',
    experience_level: 'Mid-Level',
    min_experience_years: 3.0,
    education_required: "Bachelor's Degree in Computer Science or related",
    description: '',
    required_skills: '',
    preferred_skills: '',
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const openCreateModal = () => {
    setEditingJobId(null);
    setForm({
      title: '',
      department: 'Engineering',
      location: 'Remote',
      experience_level: 'Mid-Level',
      min_experience_years: 3.0,
      education_required: "Bachelor's Degree in Computer Science or related",
      description: '',
      required_skills: '',
      preferred_skills: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      experience_level: job.experience_level,
      min_experience_years: job.min_experience_years,
      education_required: job.education_required,
      description: job.description,
      required_skills: job.required_skills.join(', '),
      preferred_skills: job.preferred_skills.join(', '),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        department: form.department,
        location: form.location,
        experience_level: form.experience_level,
        min_experience_years: parseFloat(form.min_experience_years) || 0,
        education_required: form.education_required,
        description: form.description,
        required_skills: form.required_skills
          ? form.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        preferred_skills: form.preferred_skills
          ? form.preferred_skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingJobId) {
        await api.updateJob(editingJobId, payload);
      } else {
        await api.createJob(payload);
      }

      setModalOpen(false);
      await loadJobs();
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete job opening "${title}"?`)) return;
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Job Descriptions & Requisitions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define requirements, required technical competencies, preferred skills, and experience criteria.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Job Opening</span>
        </button>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading job postings...</div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Job Descriptions Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first job specification or click "Load Sample Data" in the top bar to auto-populate standard engineering roles.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Create Job Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {job.department}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{job.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(job)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Job"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id, job.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub details */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {job.min_experience_years} Years Min ({job.experience_level})
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Required Skills */}
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Essential Required Skills ({job.required_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {job.required_skills.map((s) => (
                      <SkillTag key={s} name={s} status="default" size="xs" />
                    ))}
                  </div>
                </div>

                {/* Preferred Skills */}
                {job.preferred_skills?.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Preferred / Bonus Skills ({job.preferred_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {job.preferred_skills.map((s) => (
                        <SkillTag key={s} name={s} status="preferred" size="xs" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Updated {new Date(job.updated_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    if (setSelectedJobId) setSelectedJobId(job.id);
                    setActiveTab('rankings');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  <span>Match Candidates</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingJobId ? 'Edit Job Description' : 'Create New Job Opening'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior AI / Machine Learning Engineer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Exp (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.min_experience_years}
                    onChange={(e) => setForm({ ...form, min_experience_years: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Education Requirement</label>
                <input
                  type="text"
                  value={form.education_required}
                  onChange={(e) => setForm({ ...form, education_required: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Job Description & Responsibilities *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste or write detailed role requirements. Our AI will automatically extract skills if not specified below."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Required Core Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, PyTorch, FastAPI, Docker, PostgreSQL (leave empty to auto-extract)"
                  value={form.required_skills}
                  onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Preferred / Nice-to-Have Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="AWS, Kubernetes, Large Language Models"
                  value={form.preferred_skills}
                  onChange={(e) => setForm({ ...form, preferred_skills: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                >
                  {editingJobId ? 'Save Changes' : 'Create Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

