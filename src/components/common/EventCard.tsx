import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { SiteEvent } from '../../types';

interface EventCardProps {
  event: SiteEvent;
  onActionClick?: (actionUrl?: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onActionClick }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/80 via-[#161a29] to-[#111420] border border-violet-500/30 p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
      {/* Background decoration */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none mix-blend-luminosity"
        style={{ backgroundImage: `url(${event.bannerUrl})` }}
      />

      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{event.badge || 'EVENT'}</span>
        </div>
        <h3 className="text-lg md:text-xl font-bold text-zinc-100 tracking-tight mb-1.5">
          {event.title}
        </h3>
        <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
          {event.description}
        </p>
      </div>

      <div className="relative z-10 shrink-0">
        <button
          onClick={() => onActionClick && onActionClick(event.actionUrl)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs md:text-sm font-bold shadow-lg shadow-violet-900/40 transition-all active:scale-95 cursor-pointer"
        >
          <span>Explore Event</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
