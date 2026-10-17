import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  FileCode,
  FileText,
  Trash2,
  Eye,
  Plus,
  Upload,
  Loader2,
  AlertTriangle,
  Check,
  FileArchive,
} from 'lucide-react';
import { HostingProject, HostingFile } from '../../types';
import {
  getProjectFilesWithMeta,
  deleteProjectFile,
  addOrUpdateProjectFile,
} from '../../services/hostingService';
import { useToast } from '../../context/ToastContext';

interface FilesExplorerModalProps {
  project: HostingProject | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onFilesChanged: () => void;
}

export const FilesExplorerModal: React.FC<FilesExplorerModalProps> = ({
  project,
  isOpen,
  onClose,
  userId,
  onFilesChanged,
}) => {
  const { showToast } = useToast();
  const [filesWithMeta, setFilesWithMeta] = useState<Array<{ id: string; file: HostingFile }>>([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<HostingFile | null>(null);

  // Add new file state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      loadFiles();
    } else {
      setPreviewFile(null);
      setShowAddForm(false);
    }
  }, [isOpen, project]);

  async function loadFiles() {
    if (!project) return;
    setLoading(true);
    try {
      const data = await getProjectFilesWithMeta(project.id);
      // If no files subcollection exists yet but entryHtml is present, represent it
      if (data.length === 0 && project.entryHtml) {
        data.push({
          id: 'root_index_html',
          file: {
            path: 'index.html',
            content: project.entryHtml,
            size: project.totalSizeBytes || project.entryHtml.length,
          },
        });
      }
      setFilesWithMeta(data);
    } catch {
      showToast('Failed to load project files', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteFile = async (metaId: string, filePath: string) => {
    if (!project) return;
    if (!confirm(`Are you sure you want to permanently delete "${filePath}" from this project?`)) {
      return;
    }

    try {
      await deleteProjectFile(userId, project.id, metaId);
      showToast(`Deleted "${filePath}" successfully.`, 'info');
      if (previewFile?.path === filePath) {
        setPreviewFile(null);
      }
      await loadFiles();
      onFilesChanged();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete file.', 'error');
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const cleanPath = newFilePath.trim().replace(/^\/+/, '');
    if (!cleanPath) {
      showToast('Enter valid file name/path (e.g., about.html or style.css)', 'error');
      return;
    }

    setSavingFile(true);
    try {
      const newFile: HostingFile = {
        path: cleanPath,
        content: newFileContent,
        size: new Blob([newFileContent]).size,
      };

      await addOrUpdateProjectFile(userId, project.id, newFile);
      showToast(`Added file "${cleanPath}"!`, 'success');
      setNewFilePath('');
      setNewFileContent('');
      setShowAddForm(false);
      await loadFiles();
      onFilesChanged();
    } catch (err: any) {
      showToast(err.message || 'Failed to add file.', 'error');
    } finally {
      setSavingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (!project) return;

      try {
        const hFile: HostingFile = {
          path: file.name,
          content,
          size: file.size,
        };
        await addOrUpdateProjectFile(userId, project.id, hFile);
        showToast(`Uploaded "${file.name}"!`, 'success');
        await loadFiles();
        onFilesChanged();
      } catch (err: any) {
        showToast(err.message || 'Upload failed', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[88vh] rounded-3xl bg-[#0f121d] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base font-mono">{project.name}</h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  /hosts/{project.slug}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Inspect, add, or delete individual hosted files
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel' : 'New File'}</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create / Add file form drawer */}
        {showAddForm && (
          <form onSubmit={handleCreateFile} className="p-4 bg-[#141826] border-b border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="File path (e.g., custom.css or terms.html)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                required
              />
              <button
                type="submit"
                disabled={savingFile}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingFile ? 'Saving...' : 'Save File'}
              </button>
            </div>
            <textarea
              rows={4}
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
              placeholder="Paste file content here..."
              className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </form>
        )}

        {/* Content Body: Split view of files table & file preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Files List */}
          <div className="overflow-y-auto p-4 space-y-2 max-h-[50vh] md:max-h-full">
            <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider px-1 pb-1 flex items-center justify-between">
              <span>Files in Build ({filesWithMeta.length})</span>
              <span>Size</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                <span className="text-xs">Loading files...</span>
              </div>
            ) : filesWithMeta.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <FileCode className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">No files found in this deployment.</p>
              </div>
            ) : (
              filesWithMeta.map(({ id, file }) => {
                const isSelected = previewFile?.path === file.path;
                const isIndex = file.path.toLowerCase() === 'index.html';

                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500/50 text-white'
                        : 'bg-[#141824] hover:bg-[#181d2c] border-white/5 text-zinc-300'
                    }`}
                  >
                    <div
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="min-w-0 flex-1 truncate">
                        <span className="text-xs font-mono font-semibold block truncate">
                          {file.path}
                        </span>
                        {isIndex && (
                          <span className="text-[9px] uppercase font-bold text-emerald-400 font-mono">
                            ★ Entry Document
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-zinc-500">
                        {((file.size || 0) / 1024).toFixed(1)} KB
                      </span>

                      <button
                        onClick={() => setPreviewFile(file)}
                        title="Preview File"
                        className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Don't delete if it's the only index file unless user insists */}
                      <button
                        onClick={() => handleDeleteFile(id, file.path)}
                        title="Delete File"
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* File Content Preview Pane */}
          <div className="overflow-hidden flex flex-col bg-[#0b0e15] max-h-[50vh] md:max-h-full">
            {previewFile ? (
              <>
                <div className="p-3 bg-[#121622] border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-300 truncate">
                    Preview: {previewFile.path}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {previewFile.content.length} chars
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 whitespace-pre leading-relaxed select-text">
                  {previewFile.isBinary ? (
                    <span className="text-zinc-500 italic">Binary file content cannot be displayed in text view.</span>
                  ) : (
                    previewFile.content.slice(0, 50000)
                  )}
                  {previewFile.content.length > 50000 && (
                    <span className="text-amber-400 block mt-2">... (truncated for display)</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
                <FileCode className="w-10 h-10 text-zinc-700" />
                <p className="text-xs">Select any file on the left to inspect its source code.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141824] flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Total Size: {((project.totalSizeBytes || 0) / 1024).toFixed(1)} KB</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
