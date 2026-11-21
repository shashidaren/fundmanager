import React, { useEffect, useState, useMemo } from 'react';
import {
  Compass,
  Layers,
  Cpu,
  GitBranch,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { generateRecommendation } from '../shared/engine.js';
import PlannerView from './components/PlannerView.jsx';
import UniverseView from './components/UniverseView.jsx';
import SelfImprovingView from './components/SelfImprovingView.jsx';
import HandoffGitView from './components/HandoffGitView.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('planner');
  const [appData, setAppData] = useState(null);
  const [draftProfile, setDraftProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isSyncingGit, setIsSyncingGit] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, tone = 'success') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch('/api/bootstrap')
      .then((r) => {
        if (!r.ok) throw new Error(`Bootstrap failed (${r.status})`);
        return r.json();
      })
      .then((payload) => {
        setAppData(payload);
        setDraftProfile(payload.modelState.activeInvestorProfile);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Live instant client-side recommendation calculation while user drags sliders
  const liveRecommendation = useMemo(() => {
    if (!appData || !draftProfile) return null;
    return generateRecommendation(draftProfile, appData.fundsData, appData.modelState);
  }, [appData, draftProfile]);

  const isProfileDirty = useMemo(() => {
    if (!appData?.modelState?.activeInvestorProfile || !draftProfile) return false;
    return JSON.stringify(appData.modelState.activeInvestorProfile) !== JSON.stringify(draftProfile);
  }, [appData, draftProfile]);

  const handleSaveProfile = async (overrideProfile = null) => {
    const profileToSave = overrideProfile || draftProfile;
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSave)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to save profile');
      setAppData(payload);
      setDraftProfile(payload.modelState.activeInvestorProfile);
      showToast('Plan saved & handoff.md updated automatically!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleShariah = async (shariahOnly) => {
    const updated = { ...draftProfile, shariahOnly };
    setDraftProfile(updated);
    await handleSaveProfile(updated);
  };

  const handleRunCalibration = async (opts = {}) => {
    setIsCalibrating(true);
    try {
      const res = await fetch('/api/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Calibration failed');
      setAppData(payload);
      showToast(
        `Calibration Cycle #${payload.modelState.calibrationCycle} (${payload.modelState.marketRegime}) complete — handoff.md updated!`
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleUpdateFundMetric = async (updateBody) => {
    try {
      const res = await fetch('/api/funds/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Update failed');
      setAppData(payload);
      showToast('Fund metrics updated & reflected in handoff.md!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMutateRequirement = async (reqBody) => {
    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Requirement update failed');
      setAppData(payload);
      showToast('Roadmap updated & written to handoff.md!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSyncGit = async (message = '') => {
    setIsSyncingGit(true);
    try {
      // Save draft profile first if user edited sliders before clicking Sync Git
      if (isProfileDirty) {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftProfile)
        });
      }
      const res = await fetch('/api/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Git sync failed');
      setAppData(payload);
      showToast(payload.syncResult?.note || 'Synced to Git & updated handoff.md!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSyncingGit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading your Versa + US Index ETF Planner...</p>
        </div>
      </div>
    );
  }

  if (error || !appData || !draftProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md bg-white rounded-2xl border border-rose-200 p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Unable to load dashboard</h2>
          <p className="text-xs text-slate-600">{error || 'Unexpected state'}</p>
        </div>
      </div>
    );
  }

  const navTabs = [
    { id: 'planner', label: 'My Plan & Summary', icon: Compass },
    { id: 'universe', label: 'Versa & US ETFs (18)', icon: Layers },
    { id: 'self-improving', label: `Self-Improving (Cycle #${appData.modelState.calibrationCycle})`, icon: Cpu },
    { id: 'handoff-git', label: 'handoff.md & Git Sync', icon: GitBranch }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-fade-in">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
              toast.tone === 'error'
                ? 'bg-rose-950 text-white border-rose-800'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-xs">
              FP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">FundPilot MY</h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Layman Portfolio Advisor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Versa Malaysia (MYR) + Non-Individual US Stock ETFs (USD)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Global Shariah Filter Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => handleToggleShariah(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !draftProfile.shariahOnly
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Funds
              </button>
              <button
                type="button"
                onClick={() => handleToggleShariah(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                  draftProfile.shariahOnly
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Shariah-Only (-i)
              </button>
            </div>

            {/* One-Click Git & handoff.md Sync Button */}
            <button
              type="button"
              disabled={isSyncingGit}
              onClick={() => handleSyncGit('')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
              <span>{isSyncingGit ? 'Syncing Git...' : 'Sync Git & handoff.md'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-100">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'border-teal-600 text-teal-800 bg-teal-50/30'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'planner' && liveRecommendation && (
          <PlannerView
            draftProfile={draftProfile}
            onChangeDraft={setDraftProfile}
            onSaveProfile={() => handleSaveProfile()}
            isDirty={isProfileDirty}
            isSaving={isSavingProfile}
            recommendation={liveRecommendation}
            fxUsdMyr={appData.modelState.fxUsdMyr}
          />
        )}

        {activeTab === 'universe' && (
          <UniverseView
            rankedFunds={appData.rankedFunds}
            shariahOnly={draftProfile.shariahOnly}
            fxUsdMyr={appData.modelState.fxUsdMyr}
            onUpdateFundMetric={handleUpdateFundMetric}
          />
        )}

        {activeTab === 'self-improving' && (
          <SelfImprovingView
            modelState={appData.modelState}
            calibrationHistory={appData.calibrationHistory}
            onRunCalibration={handleRunCalibration}
            isCalibrating={isCalibrating}
          />
        )}

        {activeTab === 'handoff-git' && (
          <HandoffGitView
            gitStatus={appData.gitStatus}
            handoffMarkdown={appData.handoffMarkdown}
            requirements={appData.requirements}
            onSyncGit={handleSyncGit}
            isSyncingGit={isSyncingGit}
            onMutateRequirement={handleMutateRequirement}
          />
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            <strong>FundPilot MY</strong> · Educational Layman Portfolio Planner (Versa Malaysia + Broad US Index ETFs). Not licensed individual financial advice.
          </span>
          <span className="font-mono">
            Branch: {appData.gitStatus?.branch} · Reference synced in /handoff.md
          </span>
        </div>
      </footer>
    </div>
  );
}
