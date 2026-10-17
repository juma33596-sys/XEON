import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number; type?: 'card' | 'row' }> = ({
  count = 4,
  type = 'card',
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse rounded-2xl bg-[#141721] border border-white/5 p-4 ${
            type === 'row' ? 'h-16 w-full' : 'h-72 w-full flex flex-col justify-between'
          }`}
        >
          {type === 'card' ? (
            <>
              <div className="w-full h-36 rounded-xl bg-zinc-800/60 mb-3" />
              <div className="h-4 bg-zinc-800/80 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-800/40 rounded w-1/2 mb-4" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-20 bg-zinc-800/60 rounded-lg" />
                <div className="h-7 w-16 bg-zinc-800/80 rounded-lg" />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/70" />
                <div className="space-y-1.5">
                  <div className="w-32 h-3.5 bg-zinc-800/80 rounded" />
                  <div className="w-20 h-2.5 bg-zinc-800/40 rounded" />
                </div>
              </div>
              <div className="w-16 h-4 bg-zinc-800/70 rounded" />
            </div>
          )}
        </div>
      ))}
    </>
  );
};
