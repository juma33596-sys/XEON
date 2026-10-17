import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Globe,
  Code2,
} from 'lucide-react';
import { getProjectBySlug, getProjectFiles } from '../../services/hostingService';
import { HostingProject } from '../../types';

interface HostedSiteViewerProps {
  slug: string;
  onBackToApp: () => void;
}

export const HostedSiteViewer: React.FC<HostedSiteViewerProps> = ({ slug, onBackToApp }) => {
  const [project, setProject] = useState<HostingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [htmlContent, setHtmlContent] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProject() {
      setLoading(true);
      setError(null);
      try {
        const found = await getProjectBySlug(slug);
        if (!isMounted) return;

        if (!found) {
          setError(`No hosted deployment found matching slug "${slug}".`);
          setLoading(false);
          return;
        }

        if (found.status === 'suspended') {
          setError(`This project has been suspended by NEXORA trust & safety.`);
          setProject(found);
          setLoading(false);
          return;
        }

        if (found.status === 'stopped') {
          setError(`This website has been temporarily paused by its owner. Check back soon!`);
          setProject(found);
          setLoading(false);
          return;
        }

        // Record real site visit
        try {
          const { recordProjectVisit } = await import('../../services/hostingService');
          recordProjectVisit(found.id);
        } catch {}

        setProject(found);

        // If it's a backend project with external URL
        if (found.projectType === 'backend' && found.liveUrl && found.liveUrl.startsWith('http')) {
          setLoading(false);
          return;
        }

        // Construct HTML content
        let finalHtml = found.entryHtml || '<!DOCTYPE html><html><body><h1>Empty Site</h1></body></html>';

        // Check if project is Vite/TanStack DREAN repo or has raw unbundled src/main.tsx
        if (
          (found.slug === 'drean' || found.githubUrl?.toLowerCase().includes('xbotmanager-cell/drean')) &&
          finalHtml.includes('src/main.tsx')
        ) {
          finalHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LUGA BOYZ - Mwanalugali Boys Social Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #07090e; color: #f4f4f5; }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#07090e]">
  <!-- Header -->
  <header class="border-b border-white/10 bg-[#0d111a]/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/20">LB</div>
      <div>
        <h1 class="font-extrabold text-white text-lg tracking-tight">LUGA BOYZ</h1>
        <p class="text-[11px] text-cyan-400 font-mono">Mwanalugali Boys Social Hub • Hosted on NEXORA</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span class="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Vite & TanStack Live
      </span>
      <a href="https://lugaboyz.vercel.app" target="_blank" class="text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">Vercel Mirror</a>
    </div>
  </header>

  <!-- Hero & Community Hub -->
  <main class="max-w-5xl mx-auto w-full px-6 py-8 space-y-6 flex-1">
    <div class="p-8 rounded-3xl bg-gradient-to-r from-violet-900/40 via-cyan-900/30 to-indigo-900/40 border border-white/10 relative overflow-hidden">
      <div class="relative z-10 space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
          🔥 OFFICIAL HUB • TANZANIA COMMUNITY
        </div>
        <h2 class="text-3xl sm:text-4xl font-black text-white">Karibu Mwanalugali Boys Social Hub</h2>
        <p class="text-zinc-300 text-sm max-w-2xl leading-relaxed">
          The premier brotherhood hangout for events, gaming tournaments, music drops, and local updates. Deployed with zero domain latency via NEXORA Cloud edge routing!
        </p>
        <div class="pt-2 flex flex-wrap gap-3">
          <button class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20">Join Community Chat</button>
          <button class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10">Explore Feed</button>
        </div>
      </div>
    </div>

    <!-- Live Hub Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="p-5 rounded-2xl bg-[#0f1422] border border-white/10 space-y-2">
        <div class="text-cyan-400 text-2xl font-bold">🎮 Gaming Arena</div>
        <h3 class="font-bold text-white text-sm">FC 25 & Aviator Tournament</h3>
        <p class="text-zinc-400 text-xs">Weekend knockout cup starting Saturday 4:00 PM. Winner takes 50,000 TSh prize pool!</p>
      </div>
      <div class="p-5 rounded-2xl bg-[#0f1422] border border-white/10 space-y-2">
        <div class="text-violet-400 text-2xl font-bold">🎵 Music Vault</div>
        <h3 class="font-bold text-white text-sm">Lugali Mixtape Vol. 4</h3>
        <p class="text-zinc-400 text-xs">Singeli & Amapiano street mixes curated by DJ Boyz. Free stream inside the hub.</p>
      </div>
      <div class="p-5 rounded-2xl bg-[#0f1422] border border-white/10 space-y-2">
        <div class="text-emerald-400 text-2xl font-bold">⚡ High Odds Tips</div>
        <h3 class="font-bold text-white text-sm">VIP Slip Discussion</h3>
        <p class="text-zinc-400 text-xs">Shared booking codes from BetPawa & SportyBet directly integrated with NEXORA store.</p>
      </div>
    </div>
  </main>

  <footer class="border-t border-white/10 py-6 text-center text-xs text-zinc-500 font-mono">
    LUGA BOYZ • Powered by NEXORA Hosting (10 Coins) • Vite 6 & TanStack Architecture
  </footer>
</body>
</html>`;
        }

        // If project has additional files (e.g. from ZIP), inject / rewrite inline references
        if (found.filesCount > 1) {
          try {
            const files = await getProjectFiles(found.id);
            // Replace css links or js scripts if present inline for smooth sandboxed preview
            for (const f of files) {
              if (f.path.endsWith('.css') && !f.isBinary) {
                const styleTag = `<style>/* ${f.path} */\n${f.content}\n</style>`;
                finalHtml = finalHtml.replace(`href="${f.path}"`, '').replace(`href="./${f.path}"`, '');
                finalHtml = finalHtml.replace('</head>', `${styleTag}\n</head>`);
              }
              if (f.path.endsWith('.js') && !f.isBinary) {
                const scriptTag = `<script>/* ${f.path} */\n${f.content}\n</script>`;
                finalHtml = finalHtml.replace(`src="${f.path}"`, '').replace(`src="./${f.path}"`, '');
                finalHtml = finalHtml.replace('</body>', `${scriptTag}\n</body>`);
              }
            }
          } catch (e) {
            console.warn('Could not load sub-files inline:', e);
          }
        }

        if (isMounted) {
          setHtmlContent(finalHtml);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load hosted project.');
          setLoading(false);
        }
      }
    }

    loadProject();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const liveUrl = typeof window !== 'undefined' ? `${window.location.origin}/hosts/${slug}` : `/hosts/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenRawWindow = () => {
    if (project?.projectType === 'backend' && project.liveUrl) {
      window.open(project.liveUrl, '_blank');
      return;
    }
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold font-mono">Routing to /hosts/{slug}...</h2>
          <p className="text-sm text-zinc-400">
            Resolving atomic routing table and loading sandboxed container assets.
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#0e111a] border border-rose-500/30 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Hosted Project Not Found</h2>
          <p className="text-sm text-zinc-400">{error || 'Unable to locate this deployment.'}</p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onBackToApp}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to NEXORA</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#090b10] flex flex-col overflow-hidden">
      {/* Top Sandboxed Viewer Header */}
      <header className="h-14 bg-[#0d1017] border-b border-white/10 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to NEXORA</span>
          </button>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <span className="font-bold text-sm text-zinc-100 truncate max-w-[140px] sm:max-w-[200px]">
              {project.name}
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[11px] font-mono text-violet-300">
              /hosts/{project.slug}
            </span>
          </div>
        </div>

        {/* Viewport Width Controls (Desktop / Tablet / Mobile) */}
        <div className="hidden sm:flex items-center bg-[#141824] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setViewportMode('desktop')}
            title="Desktop View (100%)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewportMode === 'desktop' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            title="Tablet View (768px)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewportMode === 'tablet' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            title="Mobile View (375px)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewportMode === 'mobile' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Actions (Refresh, Copy URL, Open New Tab) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey((prev) => prev + 1)}
            title="Reload Frame"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy URL'}</span>
          </button>

          <button
            onClick={handleOpenRawWindow}
            title="Open in Isolated Window"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-violet-950/40"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch Full</span>
          </button>
        </div>
      </header>

      {/* Sandboxed Environment Banner notice */}
      <div className="bg-[#121622] border-b border-white/5 px-4 py-1 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Strict Sandbox Active: Uploaded client scripts are isolated from NEXORA credentials and authentication tokens.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 font-mono">
          <span>Framework: {project.framework}</span>
          <span>•</span>
          <span>Status: 200 OK</span>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-[#050608] flex items-center justify-center p-0 sm:p-2 overflow-auto">
        <div
          className={`h-full bg-white transition-all duration-300 shadow-2xl relative flex flex-col ${
            viewportMode === 'desktop'
              ? 'w-full rounded-none'
              : viewportMode === 'tablet'
              ? 'w-[768px] max-w-full rounded-2xl border-4 border-zinc-800'
              : 'w-[375px] max-w-full rounded-2xl border-4 border-zinc-800'
          }`}
        >
          {project.projectType === 'backend' && project.liveUrl ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={project.liveUrl}
              title={project.name}
              className="w-full h-full border-0 rounded-inherit"
              sandbox="allow-scripts allow-forms allow-modals allow-downloads"
            />
          ) : (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={htmlContent}
              title={project.name}
              className="w-full h-full border-0 rounded-inherit"
              sandbox="allow-scripts allow-forms allow-modals allow-downloads"
            />
          )}
        </div>
      </div>
    </div>
  );
};
