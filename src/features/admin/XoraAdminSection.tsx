import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Shield,
  Layers,
  BookOpen,
  Send,
  Zap,
  Sliders,
  Lock,
  Globe,
} from 'lucide-react';
import { fetchXoraProviderStatus, streamXoraChat } from '../../services/xoraService';
import { NEXORA_KNOWLEDGE_ARTICLES } from '../../services/xoraKnowledge';
import { XoraProviderStatus } from '../../types/xora';
import { useToast } from '../../context/ToastContext';

export const XoraAdminSection: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<XoraProviderStatus | null>(null);
  const [testingPing, setTestingPing] = useState(false);

  // Model & Config state
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b');
  const [isXoraEnabled, setIsXoraEnabled] = useState(true);
  const [isPublicReaderEnabled, setIsPublicReaderEnabled] = useState(true);
  const [rateLimitPerMin, setRateLimitPerMin] = useState(40);
  const [temperature, setTemperature] = useState(0.7);

  // Safe Testing Sandbox
  const [testPrompt, setTestPrompt] = useState('How do I exchange Coins to Diamonds?');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const checkStatus = async () => {
    setTestingPing(true);
    try {
      const res = await fetchXoraProviderStatus();
      setStatus(res);
      if (res.ok) {
        showToast(`Groq connection verified (${res.latencyMs}ms)`, 'success');
      } else {
        showToast(res.errorMessage || 'Groq connection check failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Status check failed', 'error');
    } finally {
      setTestingPing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleRunTest = async () => {
    if (!testPrompt.trim() || isTesting) return;
    setIsTesting(true);
    setTestResponse('');

    try {
      await streamXoraChat({
        messages: [{ role: 'user', content: testPrompt }],
        model: selectedModel,
        onChunk: (chunk) => setTestResponse((prev) => prev + chunk),
        onDone: (result) => {
          setIsTesting(false);
          setTestResponse(result.fullContent);
        },
        onError: (err) => {
          setIsTesting(false);
          setTestResponse(`Error: ${err.message}`);
          showToast(err.message, 'error');
        },
      });
    } catch (e: any) {
      setIsTesting(false);
      setTestResponse(`Exception: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-950/40 via-[#141724] to-[#121520] border border-violet-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-[1px] shadow-lg">
            <div className="w-full h-full bg-[#10121d] rounded-[15px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-cyan-300" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-mono tracking-tight flex items-center gap-2">
              <span>XORA AI CONTROL CHAMBER</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                GROQ INFERENCE
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Provider telemetry, model allocation, knowledge verification & safe testing sandbox
            </p>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={testingPing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
          <span>Ping Provider</span>
        </button>
      </div>

      {/* Provider Health & Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
            Provider Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            {status?.ok ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-black text-emerald-400 font-mono">
                  Online & Active
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-amber-400 font-mono">
                  {status ? 'Service Degraded' : 'Checking...'}
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 font-mono block">
            Provider: Groq Cloud API
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
            Round-Trip Latency
          </span>
          <div className="text-xl font-black font-mono text-cyan-300 mt-1">
            {status ? `${status.latencyMs} ms` : '...'}
          </div>
          <span className="text-[10px] text-zinc-400 font-mono block">
            Ultra-low latency LPU engine
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
            Active Model Architecture
          </span>
          <div className="text-sm font-black font-mono text-violet-300 mt-1 truncate">
            {selectedModel}
          </div>
          <span className="text-[10px] text-zinc-400 font-mono block">
            131,072 Tokens Context Window
          </span>
        </div>
      </div>

      {/* Model & System Controls */}
      <div className="p-5 rounded-3xl bg-[#141724] border border-white/10 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Sliders className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-black font-mono uppercase tracking-wider text-zinc-200">
            Engine & Security Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 block">
              Default Inference Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-200 font-mono focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Flagship 120B • High Intelligence)</option>
              <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Compact 20B • Lightning Fast)</option>
              <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (27B Vision & Multilingual)</option>
            </select>
            <span className="text-[10px] text-zinc-500 font-mono">
              Validated on Groq Cloud with zero cost free tier allocations.
            </span>
          </div>

          {/* Rate Limit Setting */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 block">
              Abuse & Rate Limit (Requests per minute / IP)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={rateLimitPerMin}
              onChange={(e) => setRateLimitPerMin(parseInt(e.target.value) || 40)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
            />
            <span className="text-[10px] text-zinc-500 font-mono">
              Protects against Denial of Wallet and automated scraping attacks.
            </span>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-zinc-200 block">Enable Xora AI</span>
              <span className="text-[10px] text-zinc-400">Allow users to interact with Xora across the site</span>
            </div>
            <button
              onClick={() => setIsXoraEnabled(!isXoraEnabled)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isXoraEnabled ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isXoraEnabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-zinc-200 block">Safe Public Web Reader</span>
              <span className="text-[10px] text-zinc-400">SSRF-protected retrieval of allowed public documentation</span>
            </div>
            <button
              onClick={() => setIsPublicReaderEnabled(!isPublicReaderEnabled)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isPublicReaderEnabled ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isPublicReaderEnabled ? 'Active' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* Authoritative Knowledge Base Inspection */}
      <div className="p-5 rounded-3xl bg-[#141724] border border-white/10 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black font-mono uppercase tracking-wider text-zinc-200">
              Authoritative Knowledge Registry ({NEXORA_KNOWLEDGE_ARTICLES.length} Articles)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Live Injected Grounding</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {NEXORA_KNOWLEDGE_ARTICLES.map((article) => (
            <div
              key={article.id}
              className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-xs truncate">{article.title}</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300">
                  {article.category}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Safe Testing Sandbox */}
      <div className="p-5 rounded-3xl bg-[#141724] border border-white/10 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black font-mono uppercase tracking-wider text-zinc-200">
            Admin Prompt Sandbox & Safe Testing
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Ask a test question to verify response quality and Swahili/English accuracy..."
              className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={handleRunTest}
              disabled={isTesting || !testPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Generating...' : 'Test'}</span>
            </button>
          </div>

          {testResponse && (
            <div className="p-4 rounded-2xl bg-black/60 border border-violet-500/30 text-xs font-mono text-zinc-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {testResponse}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
