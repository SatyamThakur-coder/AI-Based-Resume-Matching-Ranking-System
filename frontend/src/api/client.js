const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};
  
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = `Status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  // If response is a file (blob)
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('application/pdf') || contentType.includes('text/csv'))) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Candidates
  getCandidates: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/candidates${q ? `?${q}` : ''}`);
  },
  getCandidate: (id) => request(`/candidates/${id}`),
  uploadResumes: (files) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    return request('/candidates/upload', {
      method: 'POST',
      body: formData,
    });
  },
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),
  seedDemoCandidates: () => request('/candidates/seed-demo', { method: 'POST' }),

  // Jobs
  getJobs: () => request('/jobs'),
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (data) => request('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id, data) => request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
  seedDemoJobs: () => request('/jobs/seed-demo', { method: 'POST' }),

  // Matching
  runMatching: (jobId, candidateIds = null) =>
    request('/matching/run', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, candidate_ids: candidateIds }),
    }),
  getRankings: (jobId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/matching/results/${jobId}${q ? `?${q}` : ''}`);
  },
  getCandidateMatch: (candidateId, jobId) =>
    request(`/matching/candidate/${candidateId}/job/${jobId}`),
  compareCandidates: (jobId, candidateIds) =>
    request('/matching/compare', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, candidate_ids: candidateIds }),
    }),

  // Analytics
  getDashboardAnalytics: () => request('/analytics/dashboard'),

  // Settings
  getWeights: () => request('/settings/weights'),
  updateWeights: (weights) =>
    request('/settings/weights', {
      method: 'PUT',
      body: JSON.stringify(weights),
    }),

  // Reports URLs
  getCsvExportUrl: (jobId) => `/api/v1/reports/export/csv/${jobId}`,
  getPdfExportUrl: (jobId) => `/api/v1/reports/export/pdf/${jobId}`,
};

