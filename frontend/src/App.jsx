import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import UploadResumes from './pages/UploadResumes';
import JobDescriptions from './pages/JobDescriptions';
import CandidateRankings from './pages/CandidateRankings';
import CandidateProfile from './pages/CandidateProfile';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onRefreshData={handleRefresh} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto" key={refreshKey}>
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              setSelectedCandidateId={setSelectedCandidateId}
            />
          )}

          {activeTab === 'upload' && (
            <UploadResumes
              setActiveTab={setActiveTab}
              setSelectedCandidateId={setSelectedCandidateId}
            />
          )}

          {activeTab === 'jobs' && (
            <JobDescriptions
              setActiveTab={setActiveTab}
              setSelectedJobId={setSelectedJobId}
            />
          )}

          {activeTab === 'rankings' && (
            <CandidateRankings
              selectedJobId={selectedJobId}
              setSelectedJobId={setSelectedJobId}
              setActiveTab={setActiveTab}
              setSelectedCandidateId={setSelectedCandidateId}
            />
          )}

          {activeTab === 'profile' && (
            <CandidateProfile
              candidateId={selectedCandidateId}
              selectedJobId={selectedJobId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && <Analytics />}

          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

