import React, { useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Globe,
  Eye,
} from 'lucide-react';
import { HostingProject } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ShareQrModalProps {
  project: HostingProject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = `${origin}/hosts/${project.slug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    fullUrl
  )}&bgcolor=0f121d&color=ffffff&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsapp = () => {
    const text = `Check out "${project.name}" on NEXORA: ${fullUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `Check out "${project.name}" on NEXORA`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0f121d] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-center">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141824]">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm font-mono">{project.name}</h3>
              <p className="text-[11px] text-zinc-400">Share QR Code & Live Link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-6 space-y-4 flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-black/60 border border-white/10 shadow-xl">
            <img
              src={qrApiUrl}
              alt={`QR Code for ${project.slug}`}
              className="w-48 h-48 rounded-xl object-contain"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-cyan-400">/hosts/{project.slug}</span>
            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>{project.visitsCount || 0} visits</span>
              </span>
              <span>•</span>
              <span>v{project.version || 1}</span>
            </div>
          </div>

          {/* Copyable Link Field */}
          <div className="w-full bg-black/50 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono text-zinc-300">
            <span className="truncate mr-2 text-left">{fullUrl}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 transition-colors cursor-pointer"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full pt-1">
            <button
              onClick={handleShareWhatsapp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleShareTelegram}
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-[#141824] flex items-center justify-between">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in new window</span>
          </a>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
