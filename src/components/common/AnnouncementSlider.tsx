import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Ticket,
  Flame,
  Server,
  Gamepad2,
  Bell,
  Clock,
} from 'lucide-react';
import {
  Announcement,
  getActiveAnnouncements,
  dismissAnnouncement,
} from '../../services/announcementService';

interface AnnouncementSliderProps {
  onNavigateTab?: (tab: string, payload?: any) => void;
  className?: string;
}

export const AnnouncementSlider: React.FC<AnnouncementSliderProps> = ({
  onNavigateTab,
  className = '',
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 for auto-slide progress
  const timerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const list = await getActiveAnnouncements();
      setAnnouncements(list);
    } catch {
      // fallback
    }
  }

  // Slide auto-advance and progress bar
  useEffect(() => {
    if (announcements.length === 0 || isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const currentItem = announcements[currentIndex];
    const duration = (currentItem?.durationSeconds || 6) * 1000;
    const intervalStep = 100;
    const stepIncrement = (intervalStep / duration) * 100;

    setProgress(0);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalStep);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, announcements.length, isPaused]);

  const handleNext = () => {
    if (announcements.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
    setProgress(0);
  };

  const handlePrev = () => {
    if (announcements.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    setProgress(0);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissAnnouncement(id);
    const filtered = announcements.filter((a) => a.id !== id);
    setAnnouncements(filtered);
    if (currentIndex >= filtered.length) {
      setCurrentIndex(Math.max(0, filtered.length - 1));
    }
    setProgress(0);
  };

  const handleActionClick = (item: Announcement) => {
    if (item.actionTab && onNavigateTab) {
      onNavigateTab(item.actionTab, item.actionPayload);
    }
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex] || announcements[0];
  if (!current) return null;

  // Icon mapping
  const getIcon = (type?: string) => {
    switch (type) {
      case 'betting_code':
        return <Ticket className="w-4 h-4 text-amber-400" />;
      case 'casino':
        return <Gamepad2 className="w-4 h-4 text-rose-400" />;
      case 'hosting':
        return <Server className="w-4 h-4 text-cyan-400" />;
      case 'product':
        return <Sparkles className="w-4 h-4 text-violet-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171a29] via-[#121522] to-[#10131d] border border-amber-500/30 shadow-lg shadow-black/40 group transition-all duration-300 ${className}`}
    >
      {/* Top Countdown / Auto-Disappear Progress Indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-100 ease-linear"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left Info Section */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 shrink-0">
            {getIcon(current.entityType)}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight truncate">
                {current.title}
              </span>
              {current.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    current.badgeColor || 'bg-amber-500 text-black'
                  }`}
                >
                  {current.badge}
                </span>
              )}
              {current.durationSeconds && (
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Auto-next</span>
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-[11px] sm:text-xs leading-relaxed line-clamp-1">
              {current.message}
            </p>
          </div>
        </div>

        {/* Right Actions & Navigation */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
          {/* Action button if present */}
          {current.actionLabel && current.actionTab && (
            <button
              onClick={() => handleActionClick(current)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {current.actionLabel}
            </button>
          )}

          {/* Slider Prev / Next Controls if multiple */}
          {announcements.length > 1 && (
            <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl p-0.5">
              <button
                onClick={handlePrev}
                title="Previous announcement"
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 px-1">
                {announcements.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setProgress(0);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === currentIndex ? 'w-3 bg-amber-400' : 'w-1.5 bg-zinc-600 hover:bg-zinc-400'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                title="Next announcement"
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Dismiss (X) Button */}
          <button
            onClick={(e) => handleDismiss(current.id, e)}
            title="Dismiss announcement"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
