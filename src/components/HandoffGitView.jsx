import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  UploadCloud,
  DownloadCloud,
  FileText,
  Copy,
  Check,
  Plus,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';

export default function HandoffGitView({
  gitStatus,
  handoffMarkdown,
  requirements,
  onSyncGit,
  onPullGit,
  isSyncingGit,
  onMutateRequirement
}) {
  const [commitMsg, setCommitMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('Future Iteration');
  const [newReqNotes, setNewReqNotes] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(handoffMarkdown || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleAddReq = async (e) => {
    e.preventDefault();
    if (!newReqTitle.trim()) return;
    await onMutateRequirement({
      action: 'add',
      title: newReqTitle,
      category: newReqCategory,
      notes: newReqNotes
    });
    setNewReqTitle('');
    setNewReqNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: Git Sync Engine + Requirements Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Git Sync Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-slate-900">Git Sync & Repository Status</h2>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                gitStatus?.isClean
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {gitStatus?.isClean ? 'Working Tree Clean' : `${gitStatus?.modifiedFiles?.length || 0} Unsynced Changes`}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
            <div>
              <span className="text-slate-500">Current Branch:</span>{' '}
              <code className="font-mono font-bold text-slate-900">{gitStatus?.branch || 'unknown'}</code>
            </div>
            {gitStatus?.latestCommit && (
              <div>
                <span className="text-slate-500">Latest Commit:</span>{' '}
                <code className="font-mono font-semibold text-indigo-700">{gitStatus.latestCommit.hash}</code> —{' '}
                <span className="text-slate-700">{gitStatus.latestCommit.subject}</span>{' '}
                <span className="text-slate-400">({gitStatus.latestCommit.relativeTime})</span>
              </div>
            )}
            {gitStatus?.handoffUpdatedAt && (
              <div>
                <span className="text-slate-500">handoff.md Updated:</span>{' '}
                <span className="text-slate-700">{new Date(gitStatus.handoffUpdatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {gitStatus?.modifiedFiles?.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700">Pending Local Updates:</div>
              <div className="max-h-28 overflow-y-auto bg-slate-900 text-slate-200 rounded-lg p-2.5 font-mono text-[11px] space-y-0.5">
                {gitStatus.modifiedFiles.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Commit Note (Optional — refreshes <code className="font-mono">handoff.md</code> &amp; pushes to GitHub)
            </label>
            <input
              type="text"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="e.g. chore: update my Versa + VOO monthly plan & roadmap"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-600"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSyncingGit}
                onClick={async () => {
                  await onSyncGit(commitMsg);
                  setCommitMsg('');
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                <UploadCloud className="w-4 h-4" />
                {isSyncingGit ? 'Syncing...' : 'Commit & Push to Git'}
              </button>
              <button
                type="button"
                disabled={isSyncingGit}
                onClick={onPullGit}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                <DownloadCloud className="w-4 h-4" />
                Pull Latest from Git
              </button>
            </div>
          </div>

          {/* Recent Commits */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-slate-500" />
              Recent Git History
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(gitStatus?.recentCommits || []).map((c) => (
                <div
                  key={c.hash}
                  className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="truncate">
                    <code className="font-mono font-bold text-teal-800 mr-2">{c.hash}</code>
                    <span className="text-slate-700">{c.subject}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{c.relativeTime}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Requirements & Roadmap Backlog */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Living Requirements & Ideas Backlog (Synced to handoff.md)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Not sure of all requirements yet? Capture new ideas anytime below—every item is automatically documented inside <code className="font-mono">handoff.md</code> for easy reference across sessions.
            </p>
          </div>

          <form onSubmit={handleAddReq} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                value={newReqTitle}
                onChange={(e) => setNewReqTitle(e.target.value)}
                placeholder="New requirement or feature idea..."
                className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
              />
              <select
                value={newReqCategory}
                onChange={(e) => setNewReqCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="Future Iteration">Future Iteration</option>
                <option value="Core Recommendation">Core Recommendation</option>
                <option value="Fund Universe">Fund Universe</option>
                <option value="Self-Improving & Git">Self-Improving & Git</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newReqNotes}
                onChange={(e) => setNewReqNotes(e.target.value)}
                placeholder="Short plain-English note or goal (optional)..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Roadmap
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(requirements?.items || []).map((item) => {
              const done = item.status === 'implemented';
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    done ? 'bg-emerald-50/40 border-emerald-200/80' : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onMutateRequirement({ action: 'toggle', id: item.id })}
                    className="flex items-start gap-2.5 text-left cursor-pointer"
                  >
                    {done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold ${done ? 'text-slate-800' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{item.notes}</p>
                    </div>
                  </button>

                  {!done && (
                    <button
                      type="button"
                      title="Remove item"
                      onClick={() => onMutateRequirement({ action: 'delete', id: item.id })}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live handoff.md Reference Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live <code className="font-mono">handoff.md</code> Reference Document
              </h3>
              <p className="text-xs text-slate-500">
                Saved at repository root (<code className="font-mono">/handoff.md</code>) and updated automatically on every change.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
        </div>

        <pre className="w-full max-h-[520px] overflow-auto rounded-xl bg-slate-950 text-slate-100 p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap">
          {handoffMarkdown}
        </pre>
      </div>
    </div>
  );
}
