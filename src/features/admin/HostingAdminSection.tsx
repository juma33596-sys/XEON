import React, { useState, useEffect } from 'react';
import {
  Server,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Coins,
  RefreshCw,
  Search,
  Shield,
  Eye,
  Check,
  X,
  FileCode,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getAllHostingProjectsAdmin,
  getAllBackendRequestsAdmin,
  approveBackendRequestAtomic,
  rejectBackendRequestAtomic,
  suspendProjectAdmin,
} from '../../services/hostingService';
import { HostingProject, HostingBackendRequest } from '../../types';

export const HostingAdminSection: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<HostingProject[]>([]);
  const [requests, setBackendRequests] = useState<HostingBackendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'projects'>('requests');

  // Search filter
  const [search, setSearch] = useState('');

  // Approval Modal state
  const [approvingReq, setApprovingReq] = useState<HostingBackendRequest | null>(null);
  const [deployedUrlInput, setDeployedUrlInput] = useState('');
  const [adminFeedbackInput, setAdminFeedbackInput] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Rejection Modal state
  const [rejectingReq, setRejectingReq] = useState<HostingBackendRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Suspend Modal state
  const [suspendingProject, setSuspendingProject] = useState<HostingProject | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProjects, allRequests] = await Promise.all([
        getAllHostingProjectsAdmin(),
        getAllBackendRequestsAdmin(),
      ]);
      setProjects(allProjects);
      setBackendRequests(allRequests);
    } catch (err: any) {
      showToast(err.message || 'Failed to load hosting administrative data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Approve Request
  const handleApprove = async () => {
    if (!approvingReq || !currentUser) return;
    if (!deployedUrlInput.trim()) {
      showToast('Please enter the deployed external URL.', 'error');
      return;
    }

    setProcessingAction(true);
    try {
      await approveBackendRequestAtomic({
        requestId: approvingReq.id,
        deployedExternalUrl: deployedUrlInput.trim(),
        adminFeedback: adminFeedbackInput.trim() || 'Deployed and verified by NEXORA DevOps.',
        adminEmail: currentUser.email || 'admin@nexora.market',
      });

      showToast(`Request for "${approvingReq.projectName}" approved and project marked live!`, 'success');
      setApprovingReq(null);
      setDeployedUrlInput('');
      setAdminFeedbackInput('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve request.', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Reject Request (Auto Refund)
  const handleReject = async () => {
    if (!rejectingReq || !currentUser) return;
    if (!rejectionReasonInput.trim()) {
      showToast('Please provide a reason for rejection.', 'error');
      return;
    }

    setProcessingAction(true);
    try {
      await rejectBackendRequestAtomic({
        requestId: rejectingReq.id,
        rejectionReason: rejectionReasonInput.trim(),
        adminEmail: currentUser.email || 'admin@nexora.market',
      });

      showToast(
        `Request rejected. Held ${rejectingReq.heldCoins.toLocaleString()} Coins refunded back to user wallet.`,
        'info'
      );
      setRejectingReq(null);
      setRejectionReasonInput('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject request.', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Suspend Project
  const handleSuspend = async () => {
    if (!suspendingProject) return;
    if (!suspendReasonInput.trim()) {
      showToast('Please provide a suspension reason.', 'error');
      return;
    }

    setProcessingAction(true);
    try {
      await suspendProjectAdmin(suspendingProject.id, suspendReasonInput.trim());
      showToast(`Project "${suspendingProject.name}" suspended.`, 'info');
      setSuspendingProject(null);
      setSuspendReasonInput('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to suspend project.', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending_review').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#0e111a] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>NEXORA Hosting Administration & DevOps</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage static edge deployments, review backend infrastructure requests, and release or charge escrow holds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-[#141824] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'requests'
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Backend Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'projects'
                ? 'bg-violet-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Hosted Projects ({projects.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or requests..."
            className="bg-[#090b10] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 w-60"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: BACKEND REQUESTS REVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="p-8 text-center bg-[#0e111a] rounded-2xl border border-white/5 text-zinc-400 text-xs">
              No backend hosting requests recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {requests
                .filter(
                  (r) =>
                    !search ||
                    r.projectName.toLowerCase().includes(search.toLowerCase()) ||
                    r.projectSlug.toLowerCase().includes(search.toLowerCase()) ||
                    (r.userEmail && r.userEmail.toLowerCase().includes(search.toLowerCase()))
                )
                .map((req) => {
                  const isPending = req.status === 'pending_review';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl bg-[#0e111a] border border-white/5 space-y-3 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{req.projectName}</h3>
                            <span className="font-mono text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">
                              /hosts/{req.projectSlug}
                            </span>
                            <span className="font-mono text-xs text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                              {req.backendStack}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400">
                            Requested by: <span className="text-zinc-200">{req.userEmail || req.userId}</span> •{' '}
                            {new Date(req.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Status & Escrow pill */}
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{req.heldCoins.toLocaleString()} Coins Held</span>
                          </div>

                          {isPending && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                              Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                              Approved & Live
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold font-mono">
                              Rejected & Refunded
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="bg-[#141824] p-3 rounded-xl border border-white/5 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 font-semibold">Repository URL:</span>
                          <a
                            href={req.sourceUrlOrRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <span>{req.sourceUrlOrRepo}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {req.envVarsNotes && (
                          <div className="text-zinc-300 font-mono text-[11px] bg-[#090b10] p-2 rounded">
                            <span className="text-zinc-500 block text-[10px]">ENV VARS & NOTES:</span>
                            {req.envVarsNotes}
                          </div>
                        )}

                        {req.deployedExternalUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-emerald-400 font-semibold">Deployed Live Endpoint:</span>
                            <a
                              href={req.deployedExternalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white hover:underline flex items-center gap-1 font-mono"
                            >
                              <span>{req.deployedExternalUrl}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {req.adminFeedback && (
                          <div className="text-zinc-400 text-xs">
                            <strong className="text-zinc-300">Admin Review Notes:</strong> {req.adminFeedback}
                          </div>
                        )}
                      </div>

                      {/* Pending Action Buttons */}
                      {isPending && (
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            onClick={() => {
                              setApprovingReq(req);
                              setDeployedUrlInput(`https://${req.projectSlug}.nexora.run`);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve & Deploy (Confirm Coin Charge)</span>
                          </button>

                          <button
                            onClick={() => setRejectingReq(req)}
                            className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject Request (Refund Held Coins)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 2: ALL HOSTED PROJECTS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-[#0e111a] rounded-2xl border border-white/5 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141824] text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Slug / Path</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Framework</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {projects
                  .filter(
                    (p) =>
                      !search ||
                      p.name.toLowerCase().includes(search.toLowerCase()) ||
                      p.slug.toLowerCase().includes(search.toLowerCase()) ||
                      (p.userEmail && p.userEmail.toLowerCase().includes(search.toLowerCase()))
                  )
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-cyan-400">/hosts/{p.slug}</td>
                      <td className="py-3 px-4 text-zinc-400">{p.userEmail || p.userId.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{p.framework}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono capitalize ${
                            p.status === 'live'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : p.status === 'suspended'
                              ? 'bg-zinc-700/50 text-zinc-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/hosts/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                            title="Open Site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {p.status !== 'suspended' && (
                            <button
                              onClick={() => setSuspendingProject(p)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0e111a] border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Confirm Backend Deployment</span>
            </h3>

            <p className="text-xs text-zinc-300">
              Confirm that you have deployed <strong className="text-white">{approvingReq.projectName}</strong>. The user
              will be permanently charged the held{' '}
              <strong className="text-amber-300">{approvingReq.heldCoins.toLocaleString()} Coins</strong>.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Live Deployed URL</label>
                <input
                  type="url"
                  value={deployedUrlInput}
                  onChange={(e) => setDeployedUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">DevOps Feedback / Notes</label>
                <textarea
                  rows={3}
                  value={adminFeedbackInput}
                  onChange={(e) => setAdminFeedbackInput(e.target.value)}
                  placeholder="Deployment details, server region, uptime SLA..."
                  className="w-full bg-[#080a0f] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setApprovingReq(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processingAction}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                {processingAction ? 'Processing...' : 'Approve & Charge Escrow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0e111a] border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Reject Request & Refund Coins</span>
            </h3>

            <p className="text-xs text-zinc-300">
              Rejecting <strong className="text-white">{rejectingReq.projectName}</strong> will automatically and atomically
              refund the held{' '}
              <strong className="text-amber-300">{rejectingReq.heldCoins.toLocaleString()} Coins</strong> back to the
              user's wallet.
            </p>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-zinc-300">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Missing entry point or port specification; repository was not accessible..."
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setRejectingReq(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingAction}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                {processingAction ? 'Refunding...' : 'Confirm Rejection & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {suspendingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0e111a] border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Suspend Hosted Project</span>
            </h3>

            <p className="text-xs text-zinc-300">
              Suspending <strong className="text-white">{suspendingProject.name}</strong> will take it offline and display
              a policy notice.
            </p>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-zinc-300">Reason</label>
              <input
                type="text"
                value={suspendReasonInput}
                onChange={(e) => setSuspendReasonInput(e.target.value)}
                placeholder="Terms violation, malicious script, phishing..."
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setSuspendingProject(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={processingAction}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
