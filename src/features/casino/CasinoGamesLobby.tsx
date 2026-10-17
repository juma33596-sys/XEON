import React, { useState, useEffect } from 'react';
import {
  Flame,
  Sparkles,
  Play,
  TrendingUp,
  Search,
  Dices,
  ShieldCheck,
  Gamepad2,
  Trophy,
} from 'lucide-react';
import {
  CasinoGameConfig,
  CasinoGameKey,
  getCasinoGamesConfig,
  DEFAULT_CASINO_GAMES,
} from '../../services/casinoGamesConfigService';

export type { CasinoGameKey };

interface CasinoGamesLobbyProps {
  activeGame: CasinoGameKey | null;
  onSelectGame: (game: CasinoGameKey) => void;
}

export const CasinoGamesLobby: React.FC<CasinoGamesLobbyProps> = ({
  activeGame,
  onSelectGame,
}) => {
  const [games, setGames] = useState<CasinoGameConfig[]>(DEFAULT_CASINO_GAMES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'crash' | 'table' | 'arcade'>('all');

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const data = await getCasinoGamesConfig();
      setGames(data);
    } catch {
      setGames(DEFAULT_CASINO_GAMES);
    }
  }

  // Filter categorization
  const filteredGames = games.filter((game) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        game.title.toLowerCase().includes(q) ||
        game.tag.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category match
    if (selectedFilter === 'crash') {
      return ['aviator', 'dice', 'heads_tails'].includes(game.id);
    }
    if (selectedFilter === 'table') {
      return ['roulette', 'hilo'].includes(game.id);
    }
    if (selectedFilter === 'arcade') {
      return ['plinko', 'penalty', 'color_game', 'crypto_wheel', 'grid_7x7'].includes(game.id);
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Lobby Header & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#121520] border border-white/5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {[
            { id: 'all', label: `All Games (${games.length})`, icon: Gamepad2 },
            { id: 'crash', label: 'Crash & Fast', icon: Flame },
            { id: 'table', label: 'Table & Cards', icon: Dices },
            { id: 'arcade', label: 'Arcade & Drops', icon: Trophy },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = selectedFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40 ring-1 ring-violet-400/30'
                    : 'bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 10 games..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* 2-Columns on Mobile, 3 on Tablet, 5 on Large Screens (All 10 Games) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {filteredGames.map((game) => {
          const isActive = activeGame === game.id;

          return (
            <div
              key={game.id}
              className={`group relative text-left rounded-2xl transition-all duration-300 overflow-hidden border flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 ${
                isActive
                  ? `bg-gradient-to-b ${game.glowColor} ring-2 ring-violet-500 shadow-xl shadow-violet-950/40 border-violet-500`
                  : 'bg-[#121520] hover:bg-[#161a29] border-white/10 hover:border-violet-500/40 hover:shadow-violet-900/20'
              }`}
            >
              {/* Cover Image Container */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/60">
                <img
                  src={game.coverImageUrl}
                  alt={game.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 brightness-95 group-hover:brightness-105"
                />
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121520] via-transparent to-black/40" />

                {/* Hot / Max Payout Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {game.isHot ? (
                    <span className="flex items-center text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-md shadow-rose-900/50">
                      <Flame className="w-2.5 h-2.5 mr-0.5" />
                      HOT
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black/70 text-zinc-200 border border-white/15 backdrop-blur-sm">
                      {game.payout}
                    </span>
                  )}
                </div>

                {/* Provably Fair Shield Pill */}
                <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 border border-white/10 text-emerald-400 backdrop-blur-sm" title="Provably Fair">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              {/* Game Metadata Card Body */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-zinc-100 group-hover:text-amber-300 transition-colors truncate font-sans">
                    {game.title}
                  </h3>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">
                    {game.tag}
                  </p>
                </div>

                {/* Payout & Max Info */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span>{game.payout}</span>
                  </span>
                  <span className="text-zinc-500">
                    Min {game.minBetCoins} C
                  </span>
                </div>

                {/* Prominent PLAY NOW Button */}
                <button
                  type="button"
                  onClick={() => onSelectGame(game.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-violet-950/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer group-hover:ring-1 group-hover:ring-violet-400/50"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>PLAY NOW</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center p-8 rounded-2xl bg-black/30 border border-white/5 space-y-2">
          <Gamepad2 className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-400">No games matched "{searchQuery}"</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
            className="text-xs text-violet-400 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
