import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Upload,
  FileArchive,
  Code2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { HostingProject, HostingFile } from '../../types';
import {
  rehostProject,
  extractAndValidateZip,
  validateAndSanitizeHtml,
} from '../../services/hostingService';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

interface RehostModalProps {
  project: HostingProject | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onRehostComplete: () => void;
}

export const RehostModal: React.FC<RehostModalProps> = ({
  project,
  isOpen,
  onClose,
  userId,
  onRehostComplete,
}) => {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'zip' | 'paste'>('zip');
  const [zipFiles, setZipFiles] = useState<HostingFile[]>([]);
  const [zipEntryHtml, setZipEntryHtml] = useState<string>('');
  const [zipFileName, setZipFileName] = useState<string>('');
  const [zipError, setZipError] = useState<string | null>(null);

  const [pasteHtml, setPasteHtml] = useState<string>('');
  const [changelog, setChangelog] = useState<string>('');
  const [rehosting, setRehosting] = useState(false);

  if (!isOpen || !project) return null;

  const nextVersion = (project.version || 1) + 1;

  const handleZipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipFileName(file.name);
    setZipError(null);

    const validation = await extractAndValidateZip(file);
    if (!validation.valid || !validation.files) {
      setZipError(validation.error || 'Invalid ZIP archive.');
      setZipFiles([]);
      setZipEntryHtml('');
      return;
    }

    setZipFiles(validation.files);
    setZipEntryHtml(validation.entryHtml || '');
    showToast(`ZIP parsed: ${validation.files.length} files extracted!`, 'info');
  };

  const handleExecuteRehost = async (e: React.FormEvent) => {
    e.preventDefault();
    setRehosting(true);

    try {
      let targetFiles: HostingFile[] = [];
      let detectedFramework = project.framework;

      if (mode === 'zip') {
        if (zipFiles.length === 0) {
          throw new Error('Please select a valid ZIP archive containing your updated build.');
        }
        targetFiles = zipFiles;
        detectedFramework = 'ZIP Archive / SPA';
      } else {
        const cleanHtml = pasteHtml.trim();
        if (!cleanHtml) {
          throw new Error('Please enter updated HTML code.');
        }
        const validated = validateAndSanitizeHtml(cleanHtml);
        if (!validated.valid) {
          throw new Error(validated.error || 'HTML validation failed.');
        }
        targetFiles = [
          {
            path: 'index.html',
            content: validated.sanitized || cleanHtml,
            size: new Blob([cleanHtml]).size,
          },
        ];
        detectedFramework = 'Static HTML/JS';
      }

      await rehostProject({
        userId,
        projectId: project.id,
        files: targetFiles,
        framework: detectedFramework,
        changelog: changelog.trim(),
      });

      confetti({ particleCount: 70, spread: 60 });
      showToast(`Site "${project.name}" re-hosted successfully! Version ${nextVersion} is now live.`, 'success');
      onRehostComplete();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Re-hosting failed.', 'error');
    } finally {
      setRehosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0f121d] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base font-mono">Re-Host & Update Site</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Deploying v{nextVersion}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Updating <code className="text-cyan-400">/hosts/{project.slug}</code> (keeps the same URL)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <form onSubmit={handleExecuteRehost} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/50 border border-white/5">
            <button
              type="button"
              onClick={() => setMode('zip')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'zip'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileArchive className="w-4 h-4" />
              <span>Upload New ZIP</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'paste'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Paste Updated HTML</span>
            </button>
          </div>

          {/* Mode 1: ZIP Upload */}
          {mode === 'zip' && (
            <div className="space-y-3">
              <label className="block p-6 border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-2xl bg-black/30 hover:bg-violet-950/10 transition-colors text-center cursor-pointer">
                <Upload className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-white block">
                  {zipFileName ? zipFileName : 'Click to select updated .zip build'}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-1">
                  Ensure index.html is present in the root of the archive
                </span>
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={handleZipFileChange}
                  className="hidden"
                />
              </label>

              {zipError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{zipError}</span>
                </div>
              )}

              {zipFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    <span>Ready to deploy {zipFiles.length} file(s)</span>
                  </div>
                  <span className="font-mono font-bold">
                    {(zipFiles.reduce((acc, f) => acc + (f.size || 0), 0) / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: HTML Paste */}
          {mode === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">Updated HTML Code</label>
              <textarea
                rows={7}
                value={pasteHtml}
                onChange={(e) => setPasteHtml(e.target.value)}
                placeholder="<!DOCTYPE html><html><head><title>My Updated App</title>..."
                className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          {/* Changelog / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 block">Version Changelog / Notes (Optional)</label>
            <input
              type="text"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="e.g., Bug fixes, updated color scheme, new hero section"
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={rehosting}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rehosting}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {rehosting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deploying v{nextVersion}...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-Host Site (Deploy v{nextVersion})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
