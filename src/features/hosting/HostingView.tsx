import React, { useState, useEffect } from 'react';
import {
  Server,
  Rocket,
  Code2,
  FileArchive,
  Github,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  Coins,
  ShieldCheck,
  ArrowRight,
  Eye,
  Info,
  ChevronRight,
  Loader2,
  Upload,
  Pause,
  Play,
  Folder,
  Download,
  RotateCcw,
  QrCode,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  createAndDeployStaticProject,
  getUserHostingProjects,
  getUserBackendRequests,
  submitBackendHostingRequestAtomic,
  deleteHostingProject,
  validateSlug,
  isSlugAvailable,
  validateAndSanitizeHtml,
  extractAndValidateZip,
  inspectPublicGithubRepo,
  GithubInspectionResult,
  STATIC_HOSTING_PRICE_COINS,
  BACKEND_HOSTING_PRICE_COINS,
  toggleProjectStatus,
  downloadProjectAsZip,
} from '../../services/hostingService';
import { HostingProject, HostingBackendRequest, HostingFile } from '../../types';
import { BuildLogsModal } from './BuildLogsModal';
import { HostedSiteViewer } from './HostedSiteViewer';
import { FilesExplorerModal } from './FilesExplorerModal';
import { RehostModal } from './RehostModal';
import { ShareQrModal } from './ShareQrModal';

interface HostingViewProps {
  onOpenAuth: () => void;
  onNavigateTab?: (tab: string) => void;
  initialSlug?: string;
}

const STARTER_TEMPLATES: Record<string, { label: string; framework: string; code: string }> = {
  portfolio: {
    label: 'Cyberpunk Portfolio',
    framework: 'Static HTML/CSS',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyberpunk Digital Portfolio</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090b10;
      color: #e4e4e7;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .card {
      background: #141824;
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 24px;
      padding: 40px;
      max-width: 540px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 2.2rem;
      margin: 0 0 10px 0;
      background: linear-gradient(135deg, #a855f7, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #a1a1aa; line-height: 1.6; }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(139, 92, 246, 0.15);
      color: #c084fc;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 28px;
      border-radius: 12px;
      background: #8b5cf6;
      color: white;
      text-decoration: none;
      font-weight: bold;
      transition: transform 0.2s;
    }
    .btn:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">NEXORA HOSTED LIVE</div>
    <h1>Alex Hunter</h1>
    <p>Full-Stack Game Modder, Web3 Architect & AI Enthusiast based in Dar es Salaam.</p>
    <a href="#" class="btn" onclick="alert('Welcome to my Nexora Hosted Space!')">Get in Touch</a>
  </div>
</body>
</html>`,
  },
  game: {
    label: 'Retro Clicker Game',
    framework: 'HTML5 Canvas',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Gem Collector Mini-Game</title>
  <style>
    body {
      margin: 0;
      background: #0d0f17;
      color: white;
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    #score { font-size: 2rem; font-weight: bold; color: #38bdf8; margin-bottom: 20px; }
    #target {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, #8b5cf6, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      cursor: pointer;
      user-select: none;
      transition: transform 0.1s;
      box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
    }
    #target:active { transform: scale(0.92); }
  </style>
</head>
<body>
  <div id="score">Score: 0 Gems</div>
  <div id="target" onclick="clickGem()">💎</div>
  <p style="color:#71717a; margin-top:20px;">Click the Diamond to mine gems!</p>
  <script>
    let gems = 0;
    function clickGem() {
      gems += 1;
      document.getElementById('score').innerText = 'Score: ' + gems + ' Gems';
      const target = document.getElementById('target');
      target.style.transform = 'scale(1.15)';
      setTimeout(() => target.style.transform = 'scale(1)', 100);
    }
  </script>
</body>
</html>`,
  },
  landing: {
    label: 'Product Showcase',
    framework: 'Modern Static',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Bots Pro</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0c0e14; color: #f4f4f5; text-align: center; padding: 60px 20px; }
    .hero { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 3rem; margin-bottom: 12px; }
    p { font-size: 1.2rem; color: #a1a1aa; }
    .features { display: flex; gap: 20px; justify-content: center; margin-top: 40px; flex-wrap: wrap; }
    .box { background: #141721; padding: 24px; border-radius: 16px; border: 1px solid #27272a; width: 160px; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Apex Bots Pro</h1>
    <p>Automate workflows at 10x speed with zero server management.</p>
    <div class="features">
      <div class="box"><h3>99.9%</h3><p>Uptime</p></div>
      <div class="box"><h3>0ms</h3><p>Cold Starts</p></div>
      <div class="box"><h3>1-Click</h3><p>Deploy</p></div>
    </div>
  </div>
</body>
</html>`,
  },
};

export const HostingView: React.FC<HostingViewProps> = ({ onOpenAuth, onNavigateTab, initialSlug }) => {
  const { currentUser, userProfile } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Selected sub-tab
  const [activeTab, setActiveTab] = useState<'deployments' | 'deploy' | 'backend' | 'docs'>(
    initialSlug ? 'deployments' : 'deployments'
  );

  // Data states
  const [projects, setProjects] = useState<HostingProject[]>([]);
  const [backendRequests, setBackendRequests] = useState<HostingBackendRequest[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Modals & Viewers
  const [activeViewerSlug, setActiveViewerSlug] = useState<string | null>(initialSlug || null);
  const [logsModalProject, setLogsModalProject] = useState<HostingProject | null>(null);
  const [filesExplorerProject, setFilesExplorerProject] = useState<HostingProject | null>(null);
  const [rehostProjectTarget, setRehostProjectTarget] = useState<HostingProject | null>(null);
  const [qrModalProject, setQrModalProject] = useState<HostingProject | null>(null);

  // New Deployment Form state
  const [sourceMode, setSourceMode] = useState<'paste' | 'zip' | 'github'>('paste');
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [framework, setFramework] = useState('Static HTML');
  const [htmlCode, setHtmlCode] = useState(STARTER_TEMPLATES.portfolio.code);
  const [zipFiles, setZipFiles] = useState<HostingFile[]>([]);
  const [zipEntryHtml, setZipEntryHtml] = useState<string>('');
  const [zipSummary, setZipSummary] = useState<{ totalFiles: number; totalSize: number } | null>(null);

  // GitHub Inspection state
  const [githubUrl, setGithubUrl] = useState('');
  const [inspectingGithub, setInspectingGithub] = useState(false);
  const [githubResult, setGithubResult] = useState<GithubInspectionResult | null>(null);

  // Slug check feedback
  const [slugStatus, setSlugStatus] = useState<{ checking: boolean; available?: boolean; error?: string }>({
    checking: false,
  });

  // Deploying animation state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState<string>('');

  // Backend Request Form state
  const [beProjectName, setBeProjectName] = useState('');
  const [beProjectSlug, setBeProjectSlug] = useState('');
  const [beStack, setBeStack] = useState('Node.js + Express');
  const [beRepoUrl, setBeRepoUrl] = useState('');
  const [beEnvNotes, setBeEnvNotes] = useState('');
  const [submittingBackend, setSubmittingBackend] = useState(false);

  // Copy URL state
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Load User Data
  const loadUserData = async () => {
    if (!currentUser) return;
    setLoadingProjects(true);
    try {
      const [projs, reqs] = await Promise.all([
        getUserHostingProjects(currentUser.uid),
        getUserBackendRequests(currentUser.uid),
      ]);
      setProjects(projs);
      setBackendRequests(reqs);
    } catch (err: any) {
      console.error('Failed to load hosting data:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  // Handle Slug Auto-generation from Project Name
  const handleNameChange = (val: string) => {
    setProjectName(val);
    if (!projectSlug || projectSlug === slugify(projectName)) {
      const autoSlug = slugify(val);
      setProjectSlug(autoSlug);
      checkSlugAvailability(autoSlug);
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) {
      setSlugStatus({ checking: false });
      return;
    }
    const valResult = validateSlug(slug);
    if (!valResult.valid) {
      setSlugStatus({ checking: false, available: false, error: valResult.error });
      return;
    }

    setSlugStatus({ checking: true });
    const avail = await isSlugAvailable(slug);
    setSlugStatus({
      checking: false,
      available: avail,
      error: avail ? undefined : `Slug "${slug}" is already taken.`,
    });
  };

  // Handle ZIP File Upload
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      showToast('Please upload a valid .zip archive file.', 'error');
      return;
    }

    showToast('Unpacking and validating ZIP contents...', 'info');
    const result = await extractAndValidateZip(file);

    if (!result.valid || !result.entryHtml) {
      showToast(result.error || 'Invalid ZIP structure.', 'error');
      return;
    }

    setZipFiles(result.files);
    setZipEntryHtml(result.entryHtml);
    setZipSummary({
      totalFiles: result.files.length,
      totalSize: result.files.reduce((a, b) => a + b.size, 0),
    });

    if (!projectName) {
      const baseName = file.name.replace(/\.zip$/i, '');
      setProjectName(baseName);
      const s = slugify(baseName);
      setProjectSlug(s);
      checkSlugAvailability(s);
    }

    showToast(`ZIP successfully parsed! ${result.files.length} static assets verified.`, 'success');
  };

  // Handle GitHub Inspect
  const handleInspectGithub = async () => {
    if (!githubUrl.trim()) return;
    setInspectingGithub(true);
    setGithubResult(null);
    try {
      const res = await inspectPublicGithubRepo(githubUrl);
      setGithubResult(res);

      if (res.valid && res.repoName) {
        if (!projectName) {
          const parts = res.repoName.split('/');
          const repoName = parts[1] || parts[0];
          setProjectName(repoName);
          const s = slugify(repoName);
          setProjectSlug(s);
          checkSlugAvailability(s);
        }
      }
    } catch (e: any) {
      showToast(e.message || 'GitHub check failed', 'error');
    } finally {
      setInspectingGithub(false);
    }
  };

  // Deploy Static Project
  const handleDeployStatic = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!projectName.trim()) {
      showToast('Please enter a project name.', 'error');
      return;
    }

    if (!wallet || (wallet.coins || 0) < STATIC_HOSTING_PRICE_COINS) {
      showToast(
        `Deployment requires ${STATIC_HOSTING_PRICE_COINS} Coins. You currently have ${wallet?.coins || 0} Coins. Please top up or earn Coins.`,
        'error'
      );
      return;
    }

    const slugCheck = validateSlug(projectSlug);
    if (!slugCheck.valid) {
      showToast(slugCheck.error || 'Invalid slug.', 'error');
      return;
    }

    if (slugStatus.available === false) {
      showToast('Selected slug is not available. Please pick another.', 'error');
      return;
    }

    let finalEntryHtml = '';
    let filesToDeploy: HostingFile[] = [];

    if (sourceMode === 'paste') {
      const sanitized = validateAndSanitizeHtml(htmlCode);
      if (!sanitized.valid) {
        showToast(sanitized.error || 'HTML validation failed.', 'error');
        return;
      }
      finalEntryHtml = sanitized.sanitized;
    } else if (sourceMode === 'zip') {
      if (!zipEntryHtml) {
        showToast('Please upload a ZIP file containing index.html first.', 'error');
        return;
      }
      finalEntryHtml = zipEntryHtml;
      filesToDeploy = zipFiles;
    } else if (sourceMode === 'github') {
      if (!githubResult?.valid || !githubResult.hasIndexHtml) {
        showToast(
          'GitHub repo must have index.html in the root for direct static hosting, or request Team Backend Hosting.',
          'error'
        );
        return;
      }
      if (githubResult.fetchedHtml) {
        finalEntryHtml = githubResult.fetchedHtml;
      } else {
        // Fetch index.html directly from github raw
        try {
          const cleanUrl = githubUrl.replace(/\/$/, '');
          const match = cleanUrl.match(/github\.com\/([a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)/);
          if (!match) throw new Error('Invalid repo URL');
          const rawRes = await fetch(`https://raw.githubusercontent.com/${match[1]}/${match[2]}/main/index.html`);
          if (!rawRes.ok) {
            throw new Error('Could not fetch index.html from main branch.');
          }
          finalEntryHtml = await rawRes.text();
        } catch (err: any) {
          showToast(`Failed to pull repo files: ${err.message}`, 'error');
          return;
        }
      }
    }

    setIsDeploying(true);
    setDeployStep('Initializing build container...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setDeployStep('Validating file integrity and CSP security policies...');
      await new Promise((r) => setTimeout(r, 700));
      setDeployStep('Deducting 10 Coins and packaging atomic edge distribution bundle...');
      await new Promise((r) => setTimeout(r, 600));
      setDeployStep('Publishing to /hosts/' + projectSlug + '...');

      const deployedProject = await createAndDeployStaticProject({
        userId: currentUser.uid,
        userEmail: currentUser.email || userProfile?.email,
        name: projectName,
        slug: projectSlug,
        description: projectDescription,
        sourceMode,
        framework,
        entryHtml: finalEntryHtml,
        files: filesToDeploy,
        githubUrl: sourceMode === 'github' ? githubUrl : undefined,
      });

      // Confetti celebration!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast(`Website deployed successfully! ${STATIC_HOSTING_PRICE_COINS} Coins deducted. Live at /hosts/${deployedProject.slug}`, 'success');

      // Refresh wallet & project list
      await refreshWallet();
      await loadUserData();

      // Reset form
      setProjectName('');
      setProjectSlug('');
      setProjectDescription('');
      setZipFiles([]);
      setZipEntryHtml('');
      setZipSummary(null);

      // Switch to deployments tab
      setActiveTab('deployments');
    } catch (err: any) {
      showToast(err.message || 'Deployment failed.', 'error');
    } finally {
      setIsDeploying(false);
      setDeployStep('');
    }
  };

  // Submit Backend Request with Coin Hold
  const handleSubmitBackend = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!beProjectName.trim()) {
      showToast('Project name is required.', 'error');
      return;
    }

    const slugCheck = validateSlug(beProjectSlug);
    if (!slugCheck.valid) {
      showToast(slugCheck.error || 'Invalid slug.', 'error');
      return;
    }

    if (!beRepoUrl.trim()) {
      showToast('Repository URL or Source link is required.', 'error');
      return;
    }

    const userCoins = wallet?.coins || 0;
    if (userCoins < BACKEND_HOSTING_PRICE_COINS) {
      showToast(
        `Insufficient Coins! You need ${BACKEND_HOSTING_PRICE_COINS.toLocaleString()} Coins on escrow hold, but have ${userCoins.toLocaleString()} Coins.`,
        'error'
      );
      return;
    }

    setSubmittingBackend(true);
    try {
      const result = await submitBackendHostingRequestAtomic({
        userId: currentUser.uid,
        userEmail: currentUser.email || userProfile?.email,
        projectName: beProjectName,
        projectSlug: beProjectSlug,
        backendStack: beStack,
        envVarsNotes: beEnvNotes,
        sourceUrlOrRepo: beRepoUrl,
        heldCoins: BACKEND_HOSTING_PRICE_COINS,
      });

      showToast(
        `Request submitted! ${BACKEND_HOSTING_PRICE_COINS.toLocaleString()} Coins placed in escrow hold pending admin review.`,
        'success'
      );

      // Clear form
      setBeProjectName('');
      setBeProjectSlug('');
      setBeRepoUrl('');
      setBeEnvNotes('');

      await loadUserData();
      setActiveTab('backend');
    } catch (err: any) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmittingBackend(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (proj: HostingProject) => {
    if (!currentUser) return;
    if (!confirm(`Are you sure you want to permanently delete "${proj.name}" (/hosts/${proj.slug})?`)) {
      return;
    }

    try {
      await deleteHostingProject(currentUser.uid, proj.id);
      showToast(`Project "${proj.name}" deleted.`, 'info');
      await loadUserData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project.', 'error');
    }
  };

  // Stop / Resume Site Status Toggle
  const handleToggleStop = async (proj: HostingProject) => {
    if (!currentUser) return;
    const nextStatus = proj.status === 'stopped' ? 'live' : 'stopped';
    try {
      await toggleProjectStatus(currentUser.uid, proj.id, nextStatus);
      showToast(
        nextStatus === 'stopped'
          ? `"${proj.name}" is now stopped. Visitors will see offline notice.`
          : `"${proj.name}" resumed! Site is now live.`,
        'info'
      );
      await loadUserData();
    } catch (err: any) {
      showToast(err.message || 'Status change failed', 'error');
    }
  };

  // Download all files as a ZIP backup
  const handleDownloadBackup = async (proj: HostingProject) => {
    try {
      showToast(`Generating ZIP backup for "${proj.name}"...`, 'info');
      await downloadProjectAsZip(proj);
      showToast(`Backup downloaded for "${proj.slug}"!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to download backup', 'error');
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/hosts/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    showToast('Deployment URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // If viewing a specific project in sandboxed viewer
  if (activeViewerSlug) {
    return (
      <HostedSiteViewer
        slug={activeViewerSlug}
        onBackToApp={() => {
          setActiveViewerSlug(null);
          if (typeof window !== 'undefined') {
            window.history.pushState(null, '', '/hosting');
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121626] via-[#0d101a] to-[#090b10] border border-white/10 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold">
              <Server className="w-3.5 h-3.5" />
              <span>NEXORA CLOUD INFRASTRUCTURE</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400 font-mono tracking-tight">
              HOSTING: BUILD & DEPLOY
            </h1>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
              Instantly publish static web apps, ZIP builds, and portfolio sites without buying a domain. Request managed
              backend cloud hosting with atomic escrow protection.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap md:flex-col gap-3 w-full md:w-auto">
            <div className="bg-[#141824]/80 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3 min-w-[170px] shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 font-medium">Active Sites</div>
                <div className="text-lg font-bold text-white font-mono">{projects.length}</div>
              </div>
            </div>

            <div className="bg-[#141824]/80 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3 min-w-[170px] shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 font-medium">Your Coins</div>
                <div className="text-lg font-bold text-amber-300 font-mono">
                  {(wallet?.coins || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 flex items-center gap-2 mt-8 pt-6 border-t border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'deployments', label: 'My Deployments', icon: Layers, count: projects.length },
            { id: 'deploy', label: 'New Deployment', icon: Rocket },
            { id: 'backend', label: 'Team Backend Hosting', icon: Server, count: backendRequests.length },
            { id: 'docs', label: 'Architecture & Docs', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40 ring-1 ring-violet-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      active ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------------------- */}
      {/* TAB 1: MY DEPLOYMENTS */}
      {/* --------------------------------------------------------------------------------- */}
      {activeTab === 'deployments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-mono">Deployed Websites & Apps</h2>
              <p className="text-xs text-zinc-400">All live static deployments mapped to your account.</p>
            </div>
            <button
              onClick={() => setActiveTab('deploy')}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-violet-900/30"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Deploy New Site</span>
            </button>
          </div>

          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0e111a] rounded-2xl border border-white/5">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
              <p className="text-sm text-zinc-400">Loading deployments...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 bg-[#0e111a] rounded-2xl border border-white/5 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mx-auto flex items-center justify-center">
                <Globe className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">No Websites Deployed Yet</h3>
                <p className="text-xs text-zinc-400">
                  Deploy your first HTML page, Vite build, or game in under 10 seconds. You get an instant URL like
                  <code className="text-violet-300 ml-1">/hosts/your-project</code>.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('deploy')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-900/40"
              >
                <Rocket className="w-4 h-4" />
                <span>Launch First Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => {
                const livePath = `/hosts/${proj.slug}`;
                const isLive = proj.status === 'live';
                const isFailed = proj.status === 'failed';
                const isQueued = proj.status === 'queued';

                return (
                  <div
                    key={proj.id}
                    className="group bg-[#0e111a] border border-white/5 hover:border-violet-500/30 rounded-2xl p-5 space-y-4 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-400">
                          {proj.framework}
                        </span>

                        {isLive && (
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Live (v{proj.version || 1})</span>
                          </div>
                        )}
                        {proj.status === 'stopped' && (
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                            <Pause className="w-3 h-3 text-amber-400" />
                            <span>Site Paused</span>
                          </div>
                        )}
                        {isQueued && (
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Queued Review</span>
                          </div>
                        )}
                        {isFailed && (
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </div>
                        )}
                      </div>

                      {/* Project Info */}
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-violet-300 transition-colors">
                          {proj.name}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                          {proj.description || 'Static production build on Nexora Cloud.'}
                        </p>
                      </div>

                      {/* Slug link card */}
                      <div className="bg-[#141824] p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono text-zinc-300">
                        <span className="text-cyan-400 truncate mr-2">{livePath}</span>
                        <button
                          onClick={() => handleCopyLink(proj.slug)}
                          title="Copy Full URL"
                          className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedSlug === proj.slug ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Details row */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                        <span>{proj.filesCount} file(s) • {((proj.totalSizeBytes || 0) / 1024).toFixed(1)} KB</span>
                        <span className="flex items-center gap-1 text-emerald-400/90">
                          <Eye className="w-3 h-3" />
                          <span>{proj.visitsCount || 0} visits</span>
                        </span>
                      </div>
                    </div>

                    {/* Full Action Toolbar: Stop/Resume, Files Explorer, Re-Host, Backup, Share */}
                    <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        {/* Left action buttons */}
                        <div className="flex items-center gap-1">
                          {/* 1. Stop / Resume Button */}
                          <button
                            onClick={() => handleToggleStop(proj)}
                            title={proj.status === 'stopped' ? 'Resume Site (Turn Live)' : 'Pause / Stop Site'}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              proj.status === 'stopped'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-white/5 text-amber-400 border-white/5 hover:bg-amber-500/20'
                            }`}
                          >
                            {proj.status === 'stopped' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          {/* 2. Files Explorer & Delete Files */}
                          <button
                            onClick={() => setFilesExplorerProject(proj)}
                            title="Files Explorer (Delete or Add Files)"
                            className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer border border-white/5"
                          >
                            <Folder className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Re-Host / Update Site */}
                          <button
                            onClick={() => setRehostProjectTarget(proj)}
                            title="Re-Host / Update Code (Keep Same URL)"
                            className="p-2 rounded-xl bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-300 transition-colors cursor-pointer border border-white/5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Download Backup ZIP */}
                          <button
                            onClick={() => handleDownloadBackup(proj)}
                            title="Download All Files as ZIP"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. QR Code & Share */}
                          <button
                            onClick={() => setQrModalProject(proj)}
                            title="QR Code & Share"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* 6. Build Logs */}
                          <button
                            onClick={() => setLogsModalProject(proj)}
                            title="View Build Logs"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>

                          {/* 7. Delete Project */}
                          <button
                            onClick={() => handleDeleteProject(proj)}
                            title="Delete Site Permanently"
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer border border-white/5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* View Live / Preview Button */}
                        <button
                          onClick={() => setActiveViewerSlug(proj.slug)}
                          className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-violet-900/30"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{proj.status === 'stopped' ? 'Preview' : 'Open'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------------------- */}
      {/* TAB 2: NEW DEPLOYMENT (BUILD & DEPLOY) */}
      {/* --------------------------------------------------------------------------------- */}
      {activeTab === 'deploy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Build Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-violet-400" />
                  <span>Build & Deploy Static Project</span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Select your deployment source mode and configure your project parameters.
                </p>
              </div>

              {/* Source Mode Selector */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#141824] rounded-2xl border border-white/5">
                {[
                  { id: 'paste', label: 'Paste HTML Code', icon: Code2, desc: 'Single file or embed' },
                  { id: 'zip', label: 'Upload ZIP', icon: FileArchive, desc: 'Vite / React dist bundle' },
                  { id: 'github', label: 'GitHub Repo', icon: Github, desc: 'Public repository' },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const active = sourceMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSourceMode(mode.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer text-center ${
                        active
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">{mode.label}</span>
                      <span className="text-[10px] opacity-75 hidden sm:inline">{mode.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* MODE 1: PASTE CODE */}
              {sourceMode === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">HTML Source Code</label>
                    {/* Starter templates */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-zinc-500">Starters:</span>
                      {Object.entries(STARTER_TEMPLATES).map(([key, item]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setHtmlCode(item.code);
                            setFramework(item.framework);
                            showToast(`Loaded ${item.label} template.`, 'info');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-violet-300 hover:text-violet-200 transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={14}
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      placeholder="<!DOCTYPE html><html>...</html>"
                      className="w-full bg-[#080a0f] border border-white/10 rounded-xl p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 leading-relaxed resize-y select-text"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-zinc-500 bg-[#080a0f]/80 px-2 py-1 rounded">
                      {htmlCode.length.toLocaleString()} bytes
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: UPLOAD ZIP */}
              {sourceMode === 'zip' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-2xl p-8 text-center transition-colors bg-[#080a0f]/50">
                    <input
                      type="file"
                      id="zip-upload"
                      accept=".zip"
                      onChange={handleZipUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="zip-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white hover:text-violet-300">
                          Click to select a .ZIP file
                        </span>
                        <p className="text-xs text-zinc-400 mt-1">
                          Vite / React dist builds, Vue static bundles, or static HTML/CSS/JS folders (Max 15MB)
                        </p>
                      </div>
                    </label>
                  </div>

                  {zipSummary && (
                    <div className="bg-[#141824] rounded-xl p-4 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> ZIP Archive Validated
                        </span>
                        <span className="font-mono text-zinc-300">
                          {zipSummary.totalFiles} assets • {(zipSummary.totalSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-zinc-400">
                        {zipFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between py-0.5 border-b border-white/5">
                            <span className="truncate">{f.path}</span>
                            <span className="text-zinc-500 shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: GITHUB IMPORT */}
              {sourceMode === 'github' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Public GitHub Repository URL</label>
                      <button
                        type="button"
                        onClick={async () => {
                          const url = 'https://github.com/xbotmanager-cell/DREAN';
                          setGithubUrl(url);
                          setProjectName('LUGA BOYZ - Mwanalugali Hub');
                          setProjectSlug('drean');
                          setFramework('Vite + React + TanStack');
                          setProjectDescription('LUGA BOYZ Mwanalugali Boys Social Hub - Vite SPA & TanStack Architecture');
                          checkSlugAvailability('drean');
                          setInspectingGithub(true);
                          const res = await inspectPublicGithubRepo(url);
                          setGithubResult(res);
                          setInspectingGithub(false);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-800/40 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-300" />
                        <span>Load Sample Repo (DREAN - Vite / TanStack)</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username/repository (e.g. https://github.com/xbotmanager-cell/DREAN)"
                        className="flex-1 bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                      <button
                        onClick={handleInspectGithub}
                        disabled={inspectingGithub || !githubUrl.trim()}
                        className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {inspectingGithub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
                        <span>Inspect Repo</span>
                      </button>
                    </div>
                  </div>

                  {githubResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                        githubResult.hasIndexHtml
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : githubResult.isBackendExpected
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          : 'bg-zinc-800/50 border-white/10 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          {githubResult.isViteTanStack ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] uppercase">
                              Vite + TanStack SPA
                            </span>
                          ) : (
                            <span>{githubResult.hasIndexHtml ? 'Static Site Ready' : 'Inspection Report'}</span>
                          )}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-300">{githubResult.repoName}</span>
                      </div>

                      <p className="leading-relaxed">{githubResult.message}</p>

                      {githubResult.isViteTanStack && (
                        <div className="bg-[#080a0f]/80 p-3 rounded-lg border border-cyan-500/20 text-zinc-300 font-mono text-[11px] space-y-1">
                          <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Vite & TanStack Framework Report Verified</span>
                          </div>
                          <div className="text-zinc-400 text-[10px]">
                            • Architecture: React 19 + Vite 6 + TanStack SPA<br />
                            • Routing: Client-side routing supported under <code className="text-cyan-300">/hosts/:slug</code><br />
                            • Deployment Cost: <strong className="text-amber-400">10 Coins</strong> (Auto-deducted on publish)
                          </div>
                        </div>
                      )}

                      {githubResult.isBackendExpected && (
                        <button
                          onClick={() => {
                            setBeRepoUrl(githubUrl);
                            setBeProjectName(projectName || 'My Backend Project');
                            setActiveTab('backend');
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Switch to Team Backend Hosting Request (2,500 Coins)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Project Settings Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. LUGA BOYZ Social Hub"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Unique URL Slug</label>
                    {slugStatus.checking ? (
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> checking...
                      </span>
                    ) : slugStatus.available === true ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Available
                      </span>
                    ) : slugStatus.error ? (
                      <span className="text-[10px] text-rose-400">{slugStatus.error}</span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={projectSlug}
                      onChange={(e) => {
                        const s = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setProjectSlug(s);
                        checkSlugAvailability(s);
                      }}
                      placeholder="drean"
                      className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Framework / Tech</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="Vite + React + TanStack">Vite + React + TanStack SPA (e.g. DREAN)</option>
                    <option value="React / Vite Build">React / Vite Static Dist</option>
                    <option value="Static HTML">Static HTML / CSS / JS</option>
                    <option value="Vue / Nuxt Static">Vue / Nuxt Static Export</option>
                    <option value="Tailwind Template">Tailwind CSS Template</option>
                    <option value="HTML5 Game">HTML5 Canvas Game</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Description (Optional)</label>
                  <input
                    type="text"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Short description for preview cards"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* URL Preview */}
              <div className="bg-[#141824] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Target URL Preview:</span>
                <span className="font-mono text-cyan-400 font-semibold truncate ml-2">
                  {typeof window !== 'undefined' ? `${window.location.origin}/hosts/${projectSlug || 'my-project'}` : `/hosts/${projectSlug || 'my-project'}`}
                </span>
              </div>

              {/* Deploy Action */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleDeployStatic}
                  disabled={isDeploying || !projectName.trim() || !projectSlug.trim() || slugStatus.available === false}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xl shadow-violet-900/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{deployStep || 'Deploying...'}</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>Deploy to NEXORA Cloud (10 Coins)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-amber-400/90 font-medium">
                  <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Deployment fee: <strong>10 Coins</strong> • Full-Stack Web Services: <strong>2,500 Coins</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Guidelines & Safety */}
          <div className="space-y-6">
            <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Hosting Rules & Security</span>
              </div>
              <ul className="text-xs text-zinc-400 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-zinc-200">Deployment Pricing:</strong> Standard deployments (HTML, ZIP, Vite, TanStack SPAs) cost <strong className="text-amber-400">10 Coins</strong> per deployment. No free tier.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-zinc-200">Zero Domain Cost:</strong> Your site is instantly assigned an edge
                    route under <code className="text-cyan-300">/hosts/:slug</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-zinc-200">Strict Sandboxing:</strong> User code runs in an isolated frame
                    without access to NEXORA user tokens or cookies.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-zinc-200">Web Services (2,500 Coins):</strong> For Node.js, Python, or database backends, request{' '}
                    <button
                      onClick={() => setActiveTab('backend')}
                      className="text-violet-400 underline hover:text-violet-300 cursor-pointer font-semibold"
                    >
                      Team Managed Cloud Web Service
                    </button>.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="text-white font-mono font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Supported Frameworks</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Single HTML',
                  'Vite React Dist',
                  'Vue Static',
                  'HTML5 Games',
                  'Tailwind Standalone',
                  'Vanilla JS',
                  'Canvas 2D',
                ].map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------- */}
      {/* TAB 3: TEAM BACKEND HOSTING (NODE.JS, PYTHON, ESCROW HOLD) */}
      {/* --------------------------------------------------------------------------------- */}
      {activeTab === 'backend' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-base">
              <Server className="w-5 h-5" />
              <span>REQUEST NEXORA TEAM HOSTING (MANAGED BACKEND)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
              If your application requires a Node.js server, Express API, Python backend, PostgreSQL database, or custom
              Docker container, our DevOps team handles the cloud provisioning and configuration.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">1</span>
                <span>Hold {BACKEND_HOSTING_PRICE_COINS.toLocaleString()} Coins</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">2</span>
                <span>DevOps Provisioning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</span>
                <span>Coins Charged ONLY When Live</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">4</span>
                <span>100% Refund If Rejected</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 bg-[#0e111a] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white font-mono">Submit Backend Requirements</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Project Name</label>
                  <input
                    type="text"
                    value={beProjectName}
                    onChange={(e) => {
                      setBeProjectName(e.target.value);
                      if (!beProjectSlug) setBeProjectSlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. Apex Trading Bot API"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Desired Slug</label>
                  <input
                    type="text"
                    value={beProjectSlug}
                    onChange={(e) => setBeProjectSlug(slugify(e.target.value))}
                    placeholder="apex-bot-api"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Backend Technology Stack</label>
                  <select
                    value={beStack}
                    onChange={(e) => setBeStack(e.target.value)}
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Node.js + Express">Node.js + Express API</option>
                    <option value="Python + FastAPI">Python + FastAPI</option>
                    <option value="Python + Django">Python + Django</option>
                    <option value="PostgreSQL + Node">Node.js + PostgreSQL Database</option>
                    <option value="Docker Container">Custom Dockerfile Container</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">GitHub Repo or Source URL</label>
                  <input
                    type="url"
                    value={beRepoUrl}
                    onChange={(e) => setBeRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Environment Variables & Configuration Notes (No Secrets)
                </label>
                <textarea
                  rows={3}
                  value={beEnvNotes}
                  onChange={(e) => setBeEnvNotes(e.target.value)}
                  placeholder="PORT=8080, DB_NAME=trading, start command: npm run start..."
                  className="w-full bg-[#080a0f] border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Escrow summary */}
              <div className="bg-[#141824] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400">Escrow Coin Hold</div>
                  <div className="text-sm font-bold text-amber-300 font-mono">
                    {BACKEND_HOSTING_PRICE_COINS.toLocaleString()} Coins
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-400">Your Current Balance</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {(wallet?.coins || 0).toLocaleString()} Coins
                  </div>
                </div>

                {(wallet?.coins || 0) < BACKEND_HOSTING_PRICE_COINS && onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('topup')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Top-Up Coins
                  </button>
                )}
              </div>

              <button
                onClick={handleSubmitBackend}
                disabled={submittingBackend || !beProjectName.trim() || !beRepoUrl.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs md:text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingBackend ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Placing Escrow Hold & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4" />
                    <span>Submit Request ({BACKEND_HOSTING_PRICE_COINS.toLocaleString()} Coins Hold)</span>
                  </>
                )}
              </button>
            </div>

            {/* My Backend Requests */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white font-mono">My Requests Status</h3>

              {backendRequests.length === 0 ? (
                <div className="p-6 bg-[#0e111a] rounded-2xl border border-white/5 text-center text-xs text-zinc-400">
                  No active backend requests submitted.
                </div>
              ) : (
                <div className="space-y-3">
                  {backendRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#0e111a] border border-white/5 rounded-xl p-4 space-y-2.5 text-xs shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[140px]">{req.projectName}</span>
                        {req.status === 'pending_review' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-mono text-[10px]">
                            Pending Review
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                            Approved & Live
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-mono text-[10px]">
                            Rejected & Refunded
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-400 font-mono">
                        Stack: <span className="text-zinc-200">{req.backendStack}</span>
                      </div>

                      {req.deployedExternalUrl && (
                        <div className="pt-1">
                          <a
                            href={req.deployedExternalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{req.deployedExternalUrl}</span>
                          </a>
                        </div>
                      )}

                      {req.adminFeedback && (
                        <div className="p-2 rounded bg-white/5 text-[11px] text-zinc-300">
                          <strong className="text-zinc-200">DevOps Feedback:</strong> {req.adminFeedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------- */}
      {/* TAB 4: ARCHITECTURE & DOCS */}
      {/* --------------------------------------------------------------------------------- */}
      {activeTab === 'docs' && (
        <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white font-mono">NEXORA Hosting Architecture & Specifications</h2>
            <p className="text-xs text-zinc-400">Technical details on edge distribution, sandbox security, and deployment lifecycle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-[#141824] border border-white/5 space-y-2">
              <h4 className="font-bold text-white font-mono flex items-center gap-1.5 text-sm">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Edge Routing Without Domain Purchases</span>
              </h4>
              <p>
                Every deployment receives a unique URL on NEXORA’s host tree:
                <code className="text-violet-300 block bg-[#090b10] p-1.5 rounded mt-1 font-mono">
                  https://nexora.vercel.app/hosts/&lt;project-slug&gt;
                </code>
                Slugs are atomic and unique. System routes (such as /admin, /topup, /casino, /xora) are reserved and cannot be claimed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141824] border border-white/5 space-y-2">
              <h4 className="font-bold text-white font-mono flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Client & Account Security (CSP Sandboxing)</span>
              </h4>
              <p>
                Uploaded code executes in a sandboxed runtime. Hosted sites cannot access NEXORA cookies, authentication tokens, or localStorage, safeguarding platform operators and users alike.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141824] border border-white/5 space-y-2">
              <h4 className="font-bold text-white font-mono flex items-center gap-1.5 text-sm">
                <FileArchive className="w-4 h-4 text-violet-400" />
                <span>ZIP Uploads & Single-Page Apps (SPA)</span>
              </h4>
              <p>
                To host React, Vue, or Svelte projects, run your framework build (e.g., <code className="text-zinc-200">npm run build</code>) and compress the resulting <code className="text-zinc-200">dist/</code> folder into a ZIP archive. Make sure <code className="text-zinc-200">index.html</code> is present at the root of the archive.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141824] border border-white/5 space-y-2">
              <h4 className="font-bold text-white font-mono flex items-center gap-1.5 text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Backend Hosting & Coin Escrow Policy</span>
              </h4>
              <p>
                Backend services are manually verified by NEXORA engineers. {BACKEND_HOSTING_PRICE_COINS.toLocaleString()} Coins are placed in escrow upon submission. If the application passes security audit and deploys, the coins are charged; otherwise, they are refunded in full.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Build Logs Terminal Modal */}
      <BuildLogsModal
        project={logsModalProject}
        isOpen={!!logsModalProject}
        onClose={() => setLogsModalProject(null)}
      />

      {/* Files Explorer & Delete Hosted Files Modal */}
      <FilesExplorerModal
        project={filesExplorerProject}
        isOpen={!!filesExplorerProject}
        onClose={() => setFilesExplorerProject(null)}
        userId={currentUser?.uid || ''}
        onFilesChanged={loadUserData}
      />

      {/* Re-Host & Update Build Modal */}
      <RehostModal
        project={rehostProjectTarget}
        isOpen={!!rehostProjectTarget}
        onClose={() => setRehostProjectTarget(null)}
        userId={currentUser?.uid || ''}
        onRehostComplete={loadUserData}
      />

      {/* QR Code & Share Modal */}
      <ShareQrModal
        project={qrModalProject}
        isOpen={!!qrModalProject}
        onClose={() => setQrModalProject(null)}
      />
    </div>
  );
};
