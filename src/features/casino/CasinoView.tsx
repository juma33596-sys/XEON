import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame,
  ShieldCheck,
  TrendingUp,
  CircleDollarSign,
  Coins,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  Loader2,
  ChevronRight,
  Plane,
  Grid,
  Dices,
  Palette,
  Volume2,
  VolumeX,
  History,
  Zap,
  Ticket,
  ArrowLeft,
  Maximize2,
  Minimize2,
  X,
  Gamepad2,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  placeCasinoBetAtomic,
  cashOutCasinoAtomic,
  recordLostBet,
} from '../../services/casinoService';
import confetti from 'canvas-confetti';
import { CasinoGamesLobby, CasinoGameKey } from './CasinoGamesLobby';
import { AviatorPlayersList, AviatorPlayer } from './AviatorPlayersList';
import { CrashTrendModal, CrashHistoryItem, getMultiplierBadgeStyle } from './CrashTrendModal';
import { AviatorBetPanel } from './AviatorBetPanel';
import { CashoutNotificationPop } from './CashoutNotificationPop';
import { casinoAudio } from './casinoAudio';
import { AnnouncementSlider } from '../../components/common/AnnouncementSlider';

// Import all modular games
import { PlinkoGame } from './PlinkoGame';
import { HiLoGame } from './HiLoGame';
import { PenaltyShootoutGame } from './PenaltyShootoutGame';
import { RouletteGame } from './RouletteGame';
import { MegaWheelGame } from './MegaWheelGame';
import { HeadsTailsGame } from './HeadsTailsGame';
import { Mines7x7Game } from './Mines7x7Game';

interface CasinoViewProps {
  onOpenAuth: () => void;
  onNavigateTab?: (tab: string, payload?: any) => void;
}

const BOT_NAMES = [
  'Kiprono_Ace',
  'Amina_TZ',
  'CryptoDenis',
  'Zuri_Win',
  'Mwita_99',
  'Sarah_NBO',
  'Brian_Trader',
  'Juma_Boss',
  'Alpha_Pilot',
  'Neema_Star',
  'Tanzanite_King',
  'Apex_Rider',
  'Baraka_Coin',
  'Fatma_Gold',
  'Kelvin_Pro',
  'Rashid_FX',
  'Safari_Jack',
  'Hassan_254',
  'Zawadi_Lux',
  'Musa_Sniper',
];

const AVATAR_GRADIENTS = [
  'from-rose-500 to-amber-500',
  'from-violet-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-pink-500 to-purple-500',
  'from-amber-500 to-yellow-500',
  'from-blue-500 to-indigo-500',
  'from-cyan-500 to-blue-600',
];

function generateSimulatedRoundPlayers(roundCrashPoint: number): AviatorPlayer[] {
  const count = Math.floor(Math.random() * 8) + 14;
  const shuffledNames = [...BOT_NAMES].sort(() => 0.5 - Math.random()).slice(0, count);

  return shuffledNames.map((name, idx) => {
    const betPresets = [50, 100, 200, 350, 500, 750, 1000, 1500, 2500, 5000, 10000];
    const bet = betPresets[Math.floor(Math.random() * betPresets.length)];

    const roll = Math.random();
    let target = 1.2;
    if (roll < 0.35) {
      target = Number((1.12 + Math.random() * 0.45).toFixed(2));
    } else if (roll < 0.65) {
      target = Number((1.55 + Math.random() * 0.95).toFixed(2));
    } else if (roll < 0.85) {
      target = Number((2.5 + Math.random() * 2.5).toFixed(2));
    } else if (roll < 0.95) {
      target = Number((5.0 + Math.random() * 7.0).toFixed(2));
    } else {
      target = Number((12.0 + Math.random() * 35.0).toFixed(2));
    }

    return {
      id: `bot_${idx}_${Date.now()}`,
      name,
      avatarBg: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
      betAmount: bet,
      targetCashout: target,
      cashedOut: false,
      cashedOutMultiplier: null,
      winAmount: null,
    };
  });
}

const INITIAL_CRASH_HISTORY: CrashHistoryItem[] = [
  { id: 'ch_1', roundNumber: 1042, multiplier: 1.84, timestamp: '12:04:15', seedHash: '0x8f2a1b9c' },
  { id: 'ch_2', roundNumber: 1041, multiplier: 4.12, timestamp: '12:03:40', seedHash: '0x3c7e4d1a' },
  { id: 'ch_3', roundNumber: 1040, multiplier: 1.05, timestamp: '12:03:02', seedHash: '0x9a4f2e6b' },
  { id: 'ch_4', roundNumber: 1039, multiplier: 16.50, timestamp: '12:02:22', seedHash: '0x1d8b5c3e' },
  { id: 'ch_5', roundNumber: 1038, multiplier: 2.30, timestamp: '12:01:45', seedHash: '0x7e2c9a4f' },
  { id: 'ch_6', roundNumber: 1037, multiplier: 1.15, timestamp: '12:01:10', seedHash: '0x5b3d1f8a' },
  { id: 'ch_7', roundNumber: 1036, multiplier: 32.80, timestamp: '12:00:25', seedHash: '0x2a9e4c7b' },
  { id: 'ch_8', roundNumber: 1035, multiplier: 1.42, timestamp: '11:59:50', seedHash: '0x6c1a8d3e' },
  { id: 'ch_9', roundNumber: 1034, multiplier: 2.05, timestamp: '11:59:12', seedHash: '0x4f7b2e9a' },
  { id: 'ch_10', roundNumber: 1033, multiplier: 8.75, timestamp: '11:58:30', seedHash: '0x8d3e1a6c' },
  { id: 'ch_11', roundNumber: 1032, multiplier: 1.28, timestamp: '11:57:55', seedHash: '0x9e4c7b2a' },
  { id: 'ch_12', roundNumber: 1031, multiplier: 54.20, timestamp: '11:57:10', seedHash: '0x1a6c8d3e' },
  { id: 'ch_13', roundNumber: 1030, multiplier: 1.10, timestamp: '11:56:32', seedHash: '0x3d1f8a5b' },
  { id: 'ch_14', roundNumber: 1029, multiplier: 3.45, timestamp: '11:55:54', seedHash: '0x7b2e9a4f' },
  { id: 'ch_15', roundNumber: 1028, multiplier: 1.95, timestamp: '11:55:18', seedHash: '0x2c9a4f7e' },
];

export const CasinoView: React.FC<CasinoViewProps> = ({ onOpenAuth, onNavigateTab }) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Selected game for FULL SCREEN mode (null = in Lobby seeing all cards)
  const [fullscreenGame, setFullscreenGame] = useState<CasinoGameKey | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => casinoAudio.isEnabled());
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexora_casino_agreed') === 'true';
    }
    return false;
  });

  const coinsBalance = wallet?.coins || 0;

  // -------------------------------------------------------------
  // AVIATOR STATE
  // -------------------------------------------------------------
  const [aviatorStage, setAviatorStage] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(2.2);
  const [countdown, setCountdown] = useState(4);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1043);

  const [crashHistory, setCrashHistory] = useState<CrashHistoryItem[]>(INITIAL_CRASH_HISTORY);
  const [trendModalOpen, setTrendModalOpen] = useState(false);

  const [livePlayers, setLivePlayers] = useState<AviatorPlayer[]>(() =>
    generateSimulatedRoundPlayers(2.2)
  );
  const [prevRoundPlayers, setPrevRoundPlayers] = useState<AviatorPlayer[]>([]);

  // Bet Panel 1
  const [betAmount1, setBetAmount1] = useState('100');
  const [betActive1, setBetActive1] = useState(false);
  const [betId1, setBetId1] = useState<string | null>(null);
  const [cashedOut1, setCashedOut1] = useState<number | null>(null);
  const [autoCashout1Enabled, setAutoCashout1Enabled] = useState(false);
  const [autoCashout1Multiplier, setAutoCashout1Multiplier] = useState('2.0');

  // Bet Panel 2
  const [betAmount2, setBetAmount2] = useState('200');
  const [betActive2, setBetActive2] = useState(false);
  const [betId2, setBetId2] = useState<string | null>(null);
  const [cashedOut2, setCashedOut2] = useState<number | null>(null);
  const [autoCashout2Enabled, setAutoCashout2Enabled] = useState(false);
  const [autoCashout2Multiplier, setAutoCashout2Multiplier] = useState('3.0');

  const [milestoneAlert, setMilestoneAlert] = useState<string | null>(null);
  const lastMilestoneRef = useRef<number>(1);
  const flightInterval = useRef<any>(null);

  // -------------------------------------------------------------
  // HEADS OR TAILS STATE
  // -------------------------------------------------------------
  const [htChoice, setHtChoice] = useState<'heads' | 'tails'>('heads');
  const [htBet, setHtBet] = useState('100');
  const [htFlipping, setHtFlipping] = useState(false);
  const [htResult, setHtResult] = useState<'heads' | 'tails' | null>(null);

  // -------------------------------------------------------------
  // COLOR GAME STATE
  // -------------------------------------------------------------
  const [colorChoice, setColorChoice] = useState<'red' | 'blue' | 'green' | 'gold'>('red');
  const [colorBet, setColorBet] = useState('100');
  const [colorSpinning, setColorSpinning] = useState(false);
  const [colorResult, setColorResult] = useState<'red' | 'blue' | 'green' | 'gold' | null>(null);

  // -------------------------------------------------------------
  // 7x7 GRID GAME STATE
  // -------------------------------------------------------------
  const [gridBet, setGridBet] = useState('150');
  const [gridPlaying, setGridPlaying] = useState(false);
  const [gridTiles, setGridTiles] = useState<Array<{ id: number; state: 'hidden' | 'gem' | 'mine' }>>([]);
  const [gridMultiplier, setGridMultiplier] = useState(1.0);
  const [gridBetId, setGridBetId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // DICE GAME STATE
  // -------------------------------------------------------------
  const [diceTarget, setDiceTarget] = useState(50);
  const [diceRollMode, setDiceRollMode] = useState<'over' | 'under'>('over');
  const [diceBet, setDiceBet] = useState('100');
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceLastRoll, setDiceLastRoll] = useState<number | null>(null);

  // -------------------------------------------------------------
  // TOGGLE SOUND
  // -------------------------------------------------------------
  const handleToggleSound = () => {
    const newState = casinoAudio.toggleSound();
    setSoundEnabled(newState);
    showToast(newState ? 'Sound effects enabled' : 'Sound effects muted', 'info');
  };

  // -------------------------------------------------------------
  // AVIATOR CASH OUT HANDLERS
  // -------------------------------------------------------------
  const handleCashout1 = useCallback(async () => {
    if (!currentUser || !betId1 || !betActive1 || cashedOut1) return;
    const amt = parseInt(betAmount1);
    try {
      const currentMult = multiplier;
      const res = await cashOutCasinoAtomic(currentUser.uid, 'aviator', amt, currentMult, betId1);
      setCashedOut1(currentMult);
      refreshWallet();
      casinoAudio.playCashoutSound();
      confetti({ particleCount: 70, spread: 60 });
      showToast(
        `Cashed out Bet 1 at ${currentMult.toFixed(2)}x! +${res.payout.toLocaleString()} Coins!`,
        'success'
      );
    } catch (e: any) {
      showToast(e.message || 'Cashout failed', 'error');
    }
  }, [currentUser, betId1, betActive1, cashedOut1, betAmount1, multiplier, refreshWallet, showToast]);

  const handleCashout2 = useCallback(async () => {
    if (!currentUser || !betId2 || !betActive2 || cashedOut2) return;
    const amt = parseInt(betAmount2);
    try {
      const currentMult = multiplier;
      const res = await cashOutCasinoAtomic(currentUser.uid, 'aviator', amt, currentMult, betId2);
      setCashedOut2(currentMult);
      refreshWallet();
      casinoAudio.playCashoutSound();
      confetti({ particleCount: 70, spread: 60 });
      showToast(
        `Cashed out Bet 2 at ${currentMult.toFixed(2)}x! +${res.payout.toLocaleString()} Coins!`,
        'success'
      );
    } catch (e: any) {
      showToast(e.message || 'Cashout failed', 'error');
    }
  }, [currentUser, betId2, betActive2, cashedOut2, betAmount2, multiplier, refreshWallet, showToast]);

  // AVIATOR FLIGHT LOOP (Runs only when Aviator is in fullscreen view)
  useEffect(() => {
    if (fullscreenGame !== 'aviator' || !agreedToTerms) return;

    let timer: any;
    if (aviatorStage === 'waiting') {
      setCountdown(4);
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            startAviatorFlight();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [aviatorStage, fullscreenGame, agreedToTerms]);

  const startAviatorFlight = () => {
    const r = Math.random();
    let point = 1.0;
    if (r < 0.05) {
      point = 1.0;
    } else {
      point = Number(Math.max(1.05, 0.95 / (1 - r)).toFixed(2));
      if (point > 100) point = 100;
    }

    setCrashPoint(point);
    setMultiplier(1.0);
    setAviatorStage('flying');
    lastMilestoneRef.current = 1;
    setMilestoneAlert(null);

    const freshPlayers = generateSimulatedRoundPlayers(point);
    setLivePlayers(freshPlayers);

    let current = 1.0;
    const startTime = Date.now();

    flightInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      current = Number((1.0 + Math.pow(elapsed * 0.45, 1.45)).toFixed(2));

      setLivePlayers((prev) =>
        prev.map((player) => {
          if (!player.cashedOut && current >= player.targetCashout && player.targetCashout <= point) {
            return {
              ...player,
              cashedOut: true,
              cashedOutMultiplier: player.targetCashout,
              winAmount: Math.floor(player.betAmount * player.targetCashout),
            };
          }
          return player;
        })
      );

      if (
        autoCashout1Enabled &&
        betActive1 &&
        !cashedOut1 &&
        current >= parseFloat(autoCashout1Multiplier) &&
        current < point
      ) {
        handleCashout1();
      }

      if (
        autoCashout2Enabled &&
        betActive2 &&
        !cashedOut2 &&
        current >= parseFloat(autoCashout2Multiplier) &&
        current < point
      ) {
        handleCashout2();
      }

      const milestones = [2.0, 5.0, 10.0, 20.0, 50.0];
      for (const m of milestones) {
        if (current >= m && lastMilestoneRef.current < m && current < point) {
          lastMilestoneRef.current = m;
          casinoAudio.playAlertPop();
          setMilestoneAlert(`🚀 Multiplier reached ${m.toFixed(0)}x! Cash out now to lock profit!`);
          setTimeout(() => setMilestoneAlert(null), 2500);
          break;
        }
      }

      if (current >= point) {
        clearInterval(flightInterval.current);
        setMultiplier(point);
        setAviatorStage('crashed');
        casinoAudio.playCrashSound();

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const newHistoryItem: CrashHistoryItem = {
          id: `ch_${Date.now()}`,
          roundNumber: currentRoundNumber,
          multiplier: point,
          timestamp: timeStr,
          seedHash: `0x${Math.random().toString(16).substring(2, 10)}`,
        };

        setCrashHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);
        setCurrentRoundNumber((n) => n + 1);

        setLivePlayers((currentList) => {
          setPrevRoundPlayers(currentList);
          return currentList;
        });

        if (betActive1 && !cashedOut1 && currentUser && betId1) {
          recordLostBet(currentUser.uid, 'aviator', Number(betAmount1), betId1);
        }
        if (betActive2 && !cashedOut2 && currentUser && betId2) {
          recordLostBet(currentUser.uid, 'aviator', Number(betAmount2), betId2);
        }

        setTimeout(() => {
          setBetActive1(false);
          setBetActive2(false);
          setCashedOut1(null);
          setCashedOut2(null);
          setBetId1(null);
          setBetId2(null);
          setAviatorStage('waiting');
        }, 3200);
      } else {
        setMultiplier(current);
      }
    }, 60);
  };

  const handlePlaceBet1 = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(betAmount1);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid Coins', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    try {
      const res = await placeCasinoBetAtomic(currentUser.uid, 'aviator', amt);
      setBetId1(res.betId);
      setBetActive1(true);
      setCashedOut1(null);
      refreshWallet();
      showToast(`Placed Bet 1: ${amt.toLocaleString()} Coins`, 'info');
    } catch (e: any) {
      let msg = e?.message || 'Bet failed';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error) msg = parsed.error;
      } catch {}
      showToast(msg, 'error');
    }
  };

  const handlePlaceBet2 = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(betAmount2);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid Coins', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    try {
      const res = await placeCasinoBetAtomic(currentUser.uid, 'aviator', amt);
      setBetId2(res.betId);
      setBetActive2(true);
      setCashedOut2(null);
      refreshWallet();
      showToast(`Placed Bet 2: ${amt.toLocaleString()} Coins`, 'info');
    } catch (e: any) {
      let msg = e?.message || 'Bet failed';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error) msg = parsed.error;
      } catch {}
      showToast(msg, 'error');
    }
  };

  // Heads or Tails
  const handlePlayHeadsTails = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(htBet);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid Coins', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    setHtFlipping(true);
    setHtResult(null);

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'heads_tails', amt);
      refreshWallet();

      setTimeout(async () => {
        const outcomes: Array<'heads' | 'tails'> = ['heads', 'tails'];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        setHtResult(outcome);
        setHtFlipping(false);

        if (outcome === htChoice) {
          const winRes = await cashOutCasinoAtomic(currentUser.uid, 'heads_tails', amt, 1.96, betRes.betId);
          refreshWallet();
          casinoAudio.playCashoutSound();
          confetti({ particleCount: 80, spread: 60 });
          showToast(`Won! It landed on ${outcome.toUpperCase()}! +${winRes.payout.toLocaleString()} Coins!`, 'success');
        } else {
          await recordLostBet(currentUser.uid, 'heads_tails', amt, betRes.betId);
          casinoAudio.playCrashSound();
          showToast(`Landed on ${outcome.toUpperCase()}. Better luck next flip!`, 'error');
        }
      }, 1400);
    } catch (e: any) {
      setHtFlipping(false);
      showToast(e.message || 'Bet failed', 'error');
    }
  };

  // Color Game
  const handlePlayColorGame = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(colorBet);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid Coins', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    setColorSpinning(true);
    setColorResult(null);

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'color_game', amt);
      refreshWallet();

      setTimeout(async () => {
        const rand = Math.random();
        let landed: 'red' | 'blue' | 'green' | 'gold' = 'red';
        if (rand < 0.31) landed = 'red';
        else if (rand < 0.62) landed = 'blue';
        else if (rand < 0.93) landed = 'green';
        else landed = 'gold';

        setColorResult(landed);
        setColorSpinning(false);

        if (landed === colorChoice) {
          const mult = landed === 'gold' ? 14 : 2;
          const winRes = await cashOutCasinoAtomic(currentUser.uid, 'color_game', amt, mult, betRes.betId);
          refreshWallet();
          casinoAudio.playCashoutSound();
          confetti({ particleCount: 100, spread: 70 });
          showToast(
            `Jackpot! Landed on ${landed.toUpperCase()} (${mult}x)! +${winRes.payout.toLocaleString()} Coins!`,
            'success'
          );
        } else {
          await recordLostBet(currentUser.uid, 'color_game', amt, betRes.betId);
          casinoAudio.playCrashSound();
          showToast(`Landed on ${landed.toUpperCase()}. Round missed!`, 'error');
        }
      }, 1500);
    } catch (e: any) {
      setColorSpinning(false);
      showToast(e.message || 'Color bet failed', 'error');
    }
  };

  // 7x7 Grid Game
  const startGridGame = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(gridBet);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid Coins', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'grid_7x7', amt);
      refreshWallet();

      const tiles: Array<{ id: number; state: 'hidden' | 'gem' | 'mine' }> = [];
      for (let i = 0; i < 49; i++) {
        tiles.push({ id: i, state: 'hidden' });
      }

      setGridTiles(tiles);
      setGridMultiplier(1.0);
      setGridBetId(betRes.betId);
      setGridPlaying(true);
      showToast('7x7 Grid Initialized! Uncover cyber gems and cash out anytime.', 'info');
    } catch (e: any) {
      showToast(e.message || 'Grid init failed', 'error');
    }
  };

  const handleTileClick = async (tileId: number) => {
    if (!gridPlaying || !currentUser || !gridBetId) return;
    const tile = gridTiles[tileId];
    if (tile.state !== 'hidden') return;

    const isMine = Math.random() < 0.15;

    if (isMine) {
      const updated = gridTiles.map((t) => (t.id === tileId ? { ...t, state: 'mine' as const } : t));
      setGridTiles(updated);
      setGridPlaying(false);
      casinoAudio.playCrashSound();
      await recordLostBet(currentUser.uid, 'grid_7x7', parseInt(gridBet), gridBetId);
      showToast('Cyber Glitch Triggered! Grid reset.', 'error');
    } else {
      const nextMult = Number((gridMultiplier + 0.22).toFixed(2));
      const updated = gridTiles.map((t) => (t.id === tileId ? { ...t, state: 'gem' as const } : t));
      setGridTiles(updated);
      setGridMultiplier(nextMult);
      casinoAudio.playAlertPop();
    }
  };

  const cashOutGrid = async () => {
    if (!gridPlaying || !currentUser || !gridBetId) return;
    const amt = parseInt(gridBet);
    try {
      const winRes = await cashOutCasinoAtomic(currentUser.uid, 'grid_7x7', amt, gridMultiplier, gridBetId);
      setGridPlaying(false);
      refreshWallet();
      casinoAudio.playCashoutSound();
      confetti({ particleCount: 70, spread: 60 });
      showToast(`Grid Cashed Out at ${gridMultiplier}x! +${winRes.payout.toLocaleString()} Coins!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Grid cashout failed', 'error');
    }
  };

  // Dice Game
  const winChance = diceRollMode === 'over' ? 100 - diceTarget : diceTarget;
  const diceMultiplier = Number((98 / Math.max(1, winChance)).toFixed(2));

  const handleRollDice = async () => {
    if (!currentUser) return onOpenAuth();
    const amt = parseInt(diceBet);
    if (isNaN(amt) || amt <= 0) return showToast('Enter valid Coins', 'error');
    if (coinsBalance < amt) {
      return showToast(`Insufficient Coins! You need ${amt.toLocaleString()} Coins.`, 'error');
    }

    setDiceRolling(true);
    setDiceLastRoll(null);

    try {
      const betRes = await placeCasinoBetAtomic(currentUser.uid, 'dice', amt);
      refreshWallet();

      setTimeout(async () => {
        const roll = Math.floor(Math.random() * 100) + 1;
        setDiceLastRoll(roll);
        setDiceRolling(false);

        const won = diceRollMode === 'over' ? roll > diceTarget : roll < diceTarget;
        if (won) {
          const winRes = await cashOutCasinoAtomic(currentUser.uid, 'dice', amt, diceMultiplier, betRes.betId);
          refreshWallet();
          casinoAudio.playCashoutSound();
          confetti({ particleCount: 80, spread: 60 });
          showToast(`Rolled ${roll}! Won at ${diceMultiplier}x! +${winRes.payout.toLocaleString()} Coins!`, 'success');
        } else {
          await recordLostBet(currentUser.uid, 'dice', amt, betRes.betId);
          casinoAudio.playCrashSound();
          showToast(`Rolled ${roll}. Target missed!`, 'error');
        }
      }, 800);
    } catch (e: any) {
      setDiceRolling(false);
      showToast(e.message || 'Dice roll failed', 'error');
    }
  };

  const handleAgreeTerms = () => {
    setAgreedToTerms(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_casino_agreed', 'true');
    }
    showToast('Casino Terms Accepted. Good luck on the tables!', 'success');
  };

  // Escape key handler to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenGame) {
        setFullscreenGame(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenGame]);

  return (
    <div className="space-y-6 pb-20">
      {/* Terms Agreement Modal if not agreed */}
      {!agreedToTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#121520] border border-violet-500/40 p-6 md:p-8 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-zinc-100 font-mono tracking-tight">
              {t('casino_terms_title')}
            </h2>
            <div className="text-xs text-zinc-400 text-left p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2 leading-relaxed">
              <p>
                <strong>1. Coins Only:</strong> All games exclusively use in-app Coins. Diamonds cannot be wagered.
              </p>
              <p>
                <strong>2. Provably Fair:</strong> Every outcome is generated using cryptographic seed hashes to ensure 100% fair mathematical odds.
              </p>
              <p>
                <strong>3. Real-Time Fullscreen:</strong> Click any game card to launch immersive full-screen arcade gaming with zero page scroll down.
              </p>
            </div>
            <button
              onClick={handleAgreeTerms}
              className="w-full py-3.5 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition-all active:scale-95 cursor-pointer"
            >
              {t('casino_agree_btn')}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN LOBBY VIEW (WHEN NO GAME IS IN FULLSCREEN) */}
      {/* ============================================================ */}
      {!fullscreenGame && (
        <>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#12151f] border border-white/10 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-zinc-100 font-mono tracking-tight flex items-center gap-2">
                  <span>{t('casino_title')}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    10 PROVABLY FAIR GAMES
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">{t('casino_subtitle')}</p>
              </div>
            </div>

            {/* User Balance & Audio Toggle */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleToggleSound}
                className="p-2.5 rounded-2xl bg-black/50 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              </button>

              <div className="flex items-center gap-2 p-2 px-3.5 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-300 shadow-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold">
                  {coinsBalance.toLocaleString()} {t('coins')}
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC SLIDING ANNOUNCEMENTS BAR WITH AUTO-DISAPPEAR TIMER */}
          <AnnouncementSlider onNavigateTab={onNavigateTab} />

          {/* 10-GAME LOBBY CARDS GRID (CLICKING PLAY OPENS FULL SCREEN) */}
          <CasinoGamesLobby
            activeGame={fullscreenGame}
            onSelectGame={(gameKey) => {
              setFullscreenGame(gameKey);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* PROVABLY FAIR SYSTEM & QUICK LINKS CARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-[#121520] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>100% PROVABLY FAIR</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Every game outcome is verified with client/server SHA-256 seed hashes before the round begins.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#121520] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                <Coins className="w-4 h-4" />
                <span>INSTANT WALLET PAYOUTS</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Winnings are deposited to your Coins balance in real-time with atomic transaction safeguards.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#121520] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-xs font-mono">
                <Ticket className="w-4 h-4" />
                <span>VIP SPORTS BETTING SLIPS</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Looking for football & sports? Browse verified booking codes with 5x-135x high-odds in the store.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* IMMERSIVE FULL-SCREEN GAME MODAL (NO SCROLLING DOWN) */}
      {/* ============================================================ */}
      {fullscreenGame && (
        <div className="fixed inset-0 z-50 bg-[#090b10] flex flex-col overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {/* TOP FULLSCREEN GAME BAR */}
          <header className="sticky top-0 z-30 shrink-0 bg-[#0e111a]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFullscreenGame(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit to Lobby</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
                <span className="font-mono font-extrabold text-sm text-zinc-100 uppercase tracking-tight">
                  {fullscreenGame.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  Provably Fair 95-98% RTP
                </span>
              </div>
            </div>

            {/* Right HUD Controls */}
            <div className="flex items-center gap-2.5">
              {/* Coins Balance */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{coinsBalance.toLocaleString()} C</span>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={handleToggleSound}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setFullscreenGame(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Exit Game (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* MAIN GAME CONTAINER (CONTAINED & CENTERED WITH ZERO AWKWARD SCROLLING) */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
            {/* 1. AVIATOR CRASH */}
            {fullscreenGame === 'aviator' && (
              <div className="space-y-4 max-w-5xl mx-auto w-full">
                {/* Crash Trend Ticker Strip */}
                <div className="p-2.5 rounded-2xl bg-[#121520] border border-white/10 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2 shrink-0">
                    <History className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[11px] font-mono font-black uppercase text-zinc-400">
                      Trend:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 pr-1">
                    {crashHistory.slice(0, 15).map((item) => {
                      const badgeStyle = getMultiplierBadgeStyle(item.multiplier);
                      return (
                        <button
                          key={item.id}
                          onClick={() => setTrendModalOpen(true)}
                          className={`px-2 py-0.5 rounded-lg font-mono font-extrabold text-[11px] border shrink-0 transition-transform hover:scale-105 cursor-pointer ${badgeStyle}`}
                        >
                          {item.multiplier.toFixed(2)}x
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setTrendModalOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 text-[11px] font-mono font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Stats</span>
                  </button>
                </div>

                {/* Aviator Flight Arena */}
                <div className="relative rounded-3xl bg-gradient-to-b from-[#0a0c14] via-[#0d101a] to-[#121522] border border-white/10 p-8 shadow-2xl min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

                  <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Round #{currentRoundNumber}</span>
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      Provably Fair 95% RTP
                    </span>
                  </div>

                  {aviatorStage === 'waiting' && (
                    <div className="text-center z-10 space-y-2">
                      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto animate-pulse">
                        <Plane className="w-8 h-8 -rotate-12" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 block font-mono">
                        {t('casino_waiting_next')}
                      </span>
                      <span className="text-5xl md:text-6xl font-black font-mono text-zinc-100 tracking-tight">
                        {countdown}s
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 block">
                        Place Bet 1 and Bet 2 now
                      </span>
                    </div>
                  )}

                  {aviatorStage === 'flying' && (
                    <div className="text-center z-10 space-y-2 animate-in zoom-in-95">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl">
                          <Plane className="w-10 h-10 animate-bounce -rotate-12" />
                        </div>
                      </div>
                      <div className="text-6xl md:text-8xl font-black font-mono text-emerald-400 tracking-tighter drop-shadow-[0_0_35px_rgba(52,211,153,0.35)]">
                        {multiplier.toFixed(2)}x
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                        Airplane Climbing
                      </span>
                    </div>
                  )}

                  {aviatorStage === 'crashed' && (
                    <div className="text-center z-10 space-y-2">
                      <span className="text-xs md:text-sm font-black uppercase text-rose-400 tracking-widest block font-mono">
                        {t('casino_crashed')}
                      </span>
                      <div className="text-6xl md:text-7xl font-black font-mono text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.4)]">
                        {multiplier.toFixed(2)}x
                      </div>
                      <span className="text-xs font-mono text-zinc-500 block">
                        Next round initiating in seconds...
                      </span>
                    </div>
                  )}
                </div>

                {/* Dual Bet Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AviatorBetPanel
                    panelNumber={1}
                    title={t('casino_bet_panel_1')}
                    themeColor="violet"
                    amount={betAmount1}
                    setAmount={setBetAmount1}
                    isActive={betActive1}
                    cashedOut={cashedOut1}
                    stage={aviatorStage}
                    currentMultiplier={multiplier}
                    onPlaceBet={handlePlaceBet1}
                    onCancelBet={() => {
                      if (aviatorStage === 'waiting') {
                        setBetActive1(false);
                        setBetId1(null);
                        showToast('Cancelled Bet 1', 'info');
                      }
                    }}
                    onCashout={handleCashout1}
                    autoCashoutEnabled={autoCashout1Enabled}
                    onToggleAutoCashout={() => setAutoCashout1Enabled((v) => !v)}
                    autoCashoutMultiplier={autoCashout1Multiplier}
                    setAutoCashoutMultiplier={setAutoCashout1Multiplier}
                  />

                  <AviatorBetPanel
                    panelNumber={2}
                    title={t('casino_bet_panel_2')}
                    themeColor="cyan"
                    amount={betAmount2}
                    setAmount={setBetAmount2}
                    isActive={betActive2}
                    cashedOut={cashedOut2}
                    stage={aviatorStage}
                    currentMultiplier={multiplier}
                    onPlaceBet={handlePlaceBet2}
                    onCancelBet={() => {
                      if (aviatorStage === 'waiting') {
                        setBetActive2(false);
                        setBetId2(null);
                        showToast('Cancelled Bet 2', 'info');
                      }
                    }}
                    onCashout={handleCashout2}
                    autoCashoutEnabled={autoCashout2Enabled}
                    onToggleAutoCashout={() => setAutoCashout2Enabled((v) => !v)}
                    autoCashoutMultiplier={autoCashout2Multiplier}
                    setAutoCashoutMultiplier={setAutoCashout2Multiplier}
                  />
                </div>

                {/* Players Feed */}
                <AviatorPlayersList
                  players={livePlayers}
                  currentMultiplier={multiplier}
                  stage={aviatorStage}
                  userBets={{
                    bet1: betActive1
                      ? {
                          amount: parseInt(betAmount1) || 0,
                          cashedOut: cashedOut1,
                          active: betActive1,
                        }
                      : undefined,
                    bet2: betActive2
                      ? {
                          amount: parseInt(betAmount2) || 0,
                          cashedOut: cashedOut2,
                          active: betActive2,
                        }
                      : undefined,
                  }}
                  previousRoundPlayers={prevRoundPlayers}
                />

                <CashoutNotificationPop
                  stage={aviatorStage}
                  multiplier={multiplier}
                  bet1={
                    betActive1 && !cashedOut1
                      ? {
                          panelNumber: 1,
                          amount: parseInt(betAmount1) || 0,
                          betId: betId1,
                          cashedOut: cashedOut1,
                          onCashout: handleCashout1,
                        }
                      : undefined
                  }
                  bet2={
                    betActive2 && !cashedOut2
                      ? {
                          panelNumber: 2,
                          amount: parseInt(betAmount2) || 0,
                          betId: betId2,
                          cashedOut: cashedOut2,
                          onCashout: handleCashout2,
                        }
                      : undefined
                  }
                  milestoneAlert={milestoneAlert}
                />

                <CrashTrendModal
                  isOpen={trendModalOpen}
                  onClose={() => setTrendModalOpen(false)}
                  history={crashHistory}
                />
              </div>
            )}

            {/* 2. HEADS OR TAILS */}
            {fullscreenGame === 'heads_tails' && (
              <div className="max-w-md mx-auto w-full p-6 md:p-8 rounded-3xl bg-[#141721] border border-white/10 space-y-6 text-center shadow-2xl">
                <h2 className="text-xl font-black text-white font-mono tracking-tight">
                  Heads or Tails Coin Flip
                </h2>

                <div className="flex justify-center my-4">
                  <div
                    className={`w-28 h-28 rounded-full border-4 border-amber-400/80 bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-black font-black text-2xl shadow-xl transition-transform duration-700 ${
                      htFlipping ? 'animate-spin scale-110' : ''
                    }`}
                  >
                    {htResult ? htResult.toUpperCase() : htChoice.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setHtChoice('heads')}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                      htChoice === 'heads'
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg'
                        : 'bg-zinc-800 text-zinc-300 border-white/5'
                    }`}
                  >
                    Heads (1.96x)
                  </button>
                  <button
                    onClick={() => setHtChoice('tails')}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                      htChoice === 'tails'
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg'
                        : 'bg-zinc-800 text-zinc-300 border-white/5'
                    }`}
                  >
                    Tails (1.96x)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t('casino_bet_amount')}</label>
                  <input
                    type="number"
                    min="10"
                    value={htBet}
                    onChange={(e) => setHtBet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 font-mono font-bold text-sm text-zinc-100 text-center"
                  />
                </div>

                <button
                  onClick={handlePlayHeadsTails}
                  disabled={htFlipping}
                  className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {htFlipping ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Flip Coin (${htBet} Coins)`}
                </button>
              </div>
            )}

            {/* 3. COLOR GAME */}
            {fullscreenGame === 'color_game' && (
              <div className="max-w-md mx-auto w-full p-6 md:p-8 rounded-3xl bg-[#141721] border border-white/10 space-y-6 text-center shadow-2xl">
                <h2 className="text-xl font-black text-white font-mono tracking-tight">
                  Cyber 4-Color Wheel
                </h2>

                <div className="flex justify-center my-2">
                  <div
                    className={`w-28 h-28 rounded-3xl border-2 flex items-center justify-center font-black text-xl shadow-xl transition-all duration-500 ${
                      colorResult === 'red'
                        ? 'bg-rose-600 border-rose-400 text-white'
                        : colorResult === 'blue'
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : colorResult === 'green'
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : colorResult === 'gold'
                        ? 'bg-amber-400 border-yellow-200 text-black animate-bounce'
                        : 'bg-zinc-800 border-white/10 text-zinc-400'
                    }`}
                  >
                    {colorSpinning ? '...' : (colorResult || colorChoice).toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'red', label: 'RED (2x)', color: 'bg-rose-600 hover:bg-rose-500' },
                    { id: 'blue', label: 'BLUE (2x)', color: 'bg-blue-600 hover:bg-blue-500' },
                    { id: 'green', label: 'GREEN (2x)', color: 'bg-emerald-600 hover:bg-emerald-500' },
                    { id: 'gold', label: 'GOLD (14x)', color: 'bg-amber-500 hover:bg-amber-400 text-black' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColorChoice(c.id as any)}
                      className={`py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                        colorChoice === c.id
                          ? `${c.color} text-white border-white/40 ring-2 ring-white/30 shadow-lg`
                          : 'bg-zinc-800 text-zinc-300 border-white/5'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t('casino_bet_amount')}</label>
                  <input
                    type="number"
                    min="10"
                    value={colorBet}
                    onChange={(e) => setColorBet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 font-mono font-bold text-sm text-zinc-100 text-center"
                  />
                </div>

                <button
                  onClick={handlePlayColorGame}
                  disabled={colorSpinning}
                  className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {colorSpinning ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Spin Wheel (${colorBet} Coins)`}
                </button>
              </div>
            )}

            {/* 4. 7x7 GEM MATRIX / MINES */}
            {fullscreenGame === 'grid_7x7' && (
              <div className="max-w-xl mx-auto w-full p-6 rounded-3xl bg-[#141721] border border-white/10 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    7×7 Cyber Gem Matrix
                  </span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {gridMultiplier.toFixed(2)}x Multiplier
                  </span>
                </div>

                {gridPlaying ? (
                  <div className="grid grid-cols-7 gap-1.5 p-3 rounded-2xl bg-black/60 border border-white/10">
                    {gridTiles.map((tile) => (
                      <button
                        key={tile.id}
                        onClick={() => handleTileClick(tile.id)}
                        disabled={tile.state !== 'hidden'}
                        className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                          tile.state === 'gem'
                            ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                            : tile.state === 'mine'
                            ? 'bg-rose-600 border border-rose-400 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 border border-white/5 active:scale-95 cursor-pointer'
                        }`}
                      >
                        {tile.state === 'gem' && <Sparkles className="w-4 h-4 text-emerald-400" />}
                        {tile.state === 'mine' && <AlertTriangle className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <Grid className="w-10 h-10 text-violet-400 mx-auto" />
                    <p className="text-xs text-zinc-400">
                      Pick safe tiles on the 7×7 grid. Each gem boosts your multiplier. Avoid hidden glitches!
                    </p>
                  </div>
                )}

                {gridPlaying ? (
                  <button
                    onClick={cashOutGrid}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
                  >
                    {t('casino_cash_out')} ({(parseInt(gridBet) * gridMultiplier).toFixed(0)} Coins)
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="20"
                        value={gridBet}
                        onChange={(e) => setGridBet(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 font-mono font-bold text-sm text-zinc-100 text-center"
                      />
                    </div>
                    <button
                      onClick={startGridGame}
                      className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      Start 7×7 Grid ({gridBet} Coins)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. PROVABLY DICE */}
            {fullscreenGame === 'dice' && (
              <div className="max-w-md mx-auto w-full p-6 md:p-8 rounded-3xl bg-[#141721] border border-white/10 space-y-6 text-center shadow-2xl">
                <div className="p-6 rounded-2xl bg-black/60 border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Roll Result
                  </span>
                  <div className="text-5xl font-black font-mono text-zinc-100">
                    {diceRolling ? '...' : diceLastRoll ?? '50'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Roll {diceRollMode.toUpperCase()}: <strong className="text-zinc-100 font-mono">{diceTarget}</strong></span>
                    <span>Multiplier: <strong className="text-emerald-400 font-mono">{diceMultiplier}x</strong></span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={diceTarget}
                    onChange={(e) => setDiceTarget(parseInt(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDiceRollMode('over')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      diceRollMode === 'over'
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-zinc-800 text-zinc-400 border-white/5'
                    }`}
                  >
                    Roll Over
                  </button>
                  <button
                    onClick={() => setDiceRollMode('under')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      diceRollMode === 'under'
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-zinc-800 text-zinc-400 border-white/5'
                    }`}
                  >
                    Roll Under
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t('casino_bet_amount')}</label>
                  <input
                    type="number"
                    min="10"
                    value={diceBet}
                    onChange={(e) => setDiceBet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 font-mono font-bold text-sm text-zinc-100 text-center"
                  />
                </div>

                <button
                  onClick={handleRollDice}
                  disabled={diceRolling}
                  className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {diceRolling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Roll Dice (${diceBet} Coins)`}
                </button>
              </div>
            )}

            {/* 6. PLINKO CYBER DROP */}
            {fullscreenGame === 'plinko' && (
              <div className="max-w-2xl mx-auto w-full">
                <PlinkoGame onOpenAuth={onOpenAuth} />
              </div>
            )}

            {/* 7. HI-LO CYBER CARDS */}
            {fullscreenGame === 'hilo' && (
              <div className="max-w-xl mx-auto w-full">
                <HiLoGame onOpenAuth={onOpenAuth} />
              </div>
            )}

            {/* 8. PENALTY SHOOTOUT */}
            {fullscreenGame === 'penalty' && (
              <div className="max-w-2xl mx-auto w-full">
                <PenaltyShootoutGame onOpenAuth={onOpenAuth} />
              </div>
            )}

            {/* 9. NEON CYBER ROULETTE */}
            {fullscreenGame === 'roulette' && (
              <div className="max-w-3xl mx-auto w-full">
                <RouletteGame onOpenAuth={onOpenAuth} />
              </div>
            )}

            {/* 10. MEGA MULTIPLIER WHEEL */}
            {fullscreenGame === 'crypto_wheel' && (
              <div className="max-w-xl mx-auto w-full">
                <MegaWheelGame onOpenAuth={onOpenAuth} />
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
