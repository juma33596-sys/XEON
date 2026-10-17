import React, { useState, useEffect } from 'react';
import {
  Dices,
  Flame,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  CasinoGameConfig,
  CasinoGameKey,
  getCasinoGamesConfig,
  saveCasinoGameCover,
  DEFAULT_CASINO_GAMES,
} from '../../services/casinoGamesConfigService';
import { useToast } from '../../context/ToastContext';

export const CasinoAdminSection: React.FC = () => {
  const { showToast } = useToast();
  const [games, setGames] = useState<CasinoGameConfig[]>(DEFAULT_CASINO_GAMES);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingGameId, setEditingGameId] = useState<CasinoGameKey | null>(null);
  const [coverInputUrl, setCoverInputUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    setLoading(true);
    try {
      const data = await getCasinoGamesConfig();
      setGames(data);
    } catch (err) {
      console.error('Failed to load casino games config:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectForEdit = (game: CasinoGameConfig) => {
    setEditingGameId(game.id);
    setCoverInputUrl(game.coverImageUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCoverInputUrl(result);
      showToast(`Selected "${file.name}". Click "Save Cover Image" to apply.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGameId || !coverInputUrl.trim()) {
      showToast('Please upload an image or provide a cover image URL.', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveCasinoGameCover(editingGameId, coverInputUrl.trim());
      setGames((prev) =>
        prev.map((g) => (g.id === editingGameId ? { ...g, coverImageUrl: coverInputUrl.trim() } : g))
      );
      showToast(`New cover image saved for ${editingGameId.toUpperCase()}! Updated in casino lobby.`, 'success');
      setEditingGameId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save casino cover', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e111a] border border-white/5 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-black text-white font-mono tracking-tight">
              Casino Games & Cover Images Manager
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Admin can upload or customize cover images for Aviator Crash, Heads &amp; Tails, Color Wheel, 7x7 Gem Matrix &amp; Dice.
          </p>
        </div>

        <button
          onClick={loadGames}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5 flex items-center gap-1.5 text-xs font-mono"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2-Column Small Cards Grid for Casino Games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => {
          const isSelected = editingGameId === game.id;

          return (
            <div
              key={game.id}
              className={`bg-[#0e111a] border rounded-2xl overflow-hidden transition-all shadow-lg flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Cover Preview Image */}
                <div className="relative aspect-[16/10] bg-black/50 overflow-hidden">
                  <img
                    src={game.coverImageUrl}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-transparent to-black/30" />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {game.isHot ? (
                      <span className="flex items-center text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-md">
                        <Flame className="w-2.5 h-2.5 mr-0.5" />
                        HOT
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/60 text-zinc-300 border border-white/10">
                        {game.tag}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                    {game.payout}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-white text-sm font-sans">{game.title}</h3>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{game.id}</span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>

                  <div className="bg-[#141824] p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Bet Limits:</span>
                    <span className="text-amber-400 font-bold">
                      {game.minBetCoins} - {game.maxBetCoins.toLocaleString()} Coins
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => handleSelectForEdit(game)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isSelected ? 'Editing Cover Below' : 'Change Cover Image'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cover Image Upload / Edit Modal or Drawer */}
      {editingGameId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121624] border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Update Cover for {games.find((g) => g.id === editingGameId)?.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingGameId(null)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Preview */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-lg">
              <img
                src={coverInputUrl || games.find((g) => g.id === editingGameId)?.coverImageUrl}
                alt="Cover Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-white font-black text-sm font-mono">Cover Preview</span>
              </div>
            </div>

            <form onSubmit={handleSaveCover} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Upload Image File from Device:</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer bg-[#080a0f] p-2 rounded-xl border border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">
                  Or Paste External Image URL:
                </label>
                <input
                  type="url"
                  value={coverInputUrl}
                  onChange={(e) => setCoverInputUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGameId(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Cover...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Save Cover Image</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
