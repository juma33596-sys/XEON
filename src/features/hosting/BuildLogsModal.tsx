import React from 'react';
import { Terminal, X, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { HostingProject } from '../../types';

interface BuildLogsModalProps {
  project: HostingProject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BuildLogsModal: React.FC<BuildLogsModalProps> = ({ project, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !project) return null;

  const logsText = (project.buildLogs || []).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(logsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0d1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#131722] border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-zinc-300">
              Build Logs: {project.name} ({project.slug})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Logs'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Meta Bar */}
        <div className="px-4 py-2 bg-[#090b10] border-b border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-4">
            <span>Framework: <span className="text-violet-400">{project.framework}</span></span>
            <span>Source: <span className="text-cyan-400">{project.sourceMode.toUpperCase()}</span></span>
            <span>Files: <span className="text-zinc-200">{project.filesCount}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            {project.status === 'live' ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live & Ready
              </span>
            ) : project.status === 'failed' ? (
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Build Failed
              </span>
            ) : (
              <span className="text-amber-400 capitalize">{project.status}</span>
            )}
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-zinc-300 bg-[#090b10] space-y-1.5 select-text">
          {project.buildLogs && project.buildLogs.length > 0 ? (
            project.buildLogs.map((log, index) => {
              const isSuccess = log.includes('successful') || log.includes('Live') || log.includes('OK');
              const isError = log.includes('Failed') || log.includes('Error') || log.includes('Exception');
              const isWarn = log.includes('WARN') || log.includes('Pending');

              return (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    isSuccess
                      ? 'text-emerald-400'
                      : isError
                      ? 'text-rose-400'
                      : isWarn
                      ? 'text-amber-300'
                      : 'text-zinc-300'
                  }`}
                >
                  {log}
                </div>
              );
            })
          ) : (
            <div className="text-zinc-500 italic">No build output recorded for this deployment.</div>
          )}

          {project.buildError && (
            <div className="p-3 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <span className="font-bold">Error Details:</span> {project.buildError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#131722] border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-mono">
            Target Endpoint: {project.liveUrl || `/hosts/${project.slug}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
