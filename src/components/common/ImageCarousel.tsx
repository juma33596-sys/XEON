import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g., 'aspect-[16/10]'
  autoPlayInterval?: number; // ms, default 3500
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  className = '',
  aspectRatio = 'aspect-[16/10]',
  autoPlayInterval = 3500,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasError, setHasError] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const validImages = images && images.length > 0 ? images : ['/placeholder.png'];
  const hasMultiple = validImages.length > 1;

  // Check reduced-motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    if (!hasMultiple || isPaused || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [hasMultiple, isPaused, prefersReducedMotion, validImages.length, autoPlayInterval]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 45) {
        // swipe left -> next
        handleNext();
      } else if (diff < -45) {
        // swipe right -> prev
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  // Single Image Mode
  if (!hasMultiple) {
    const currentImg = validImages[0];
    const isError = hasError[0];

    return (
      <div className={`relative overflow-hidden rounded-xl bg-zinc-900 ${aspectRatio} ${className}`}>
        {isError || !currentImg ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-800/60 p-4">
            <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
            <span className="text-xs font-mono">{alt}</span>
          </div>
        ) : (
          <img
            src={currentImg}
            alt={alt}
            loading="lazy"
            onError={() => setHasError((prev) => ({ ...prev, [0]: true }))}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
    );
  }

  // Multi-Image Slideshow Mode
  return (
    <div
      className={`group/carousel relative overflow-hidden rounded-xl bg-zinc-900 ${aspectRatio} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Images container */}
      <div className="w-full h-full relative">
        {validImages.map((img, idx) => {
          const isError = hasError[idx];
          const isActive = idx === currentIndex;

          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {isError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-800/80 p-4">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
                  <span className="text-xs font-mono">Image preview unavailable</span>
                </div>
              ) : (
                <img
                  src={img}
                  alt={`${alt} slide ${idx + 1}`}
                  loading="lazy"
                  onError={() => setHasError((prev) => ({ ...prev, [idx]: true }))}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Prev / Next controls */}
      <button
        onClick={handlePrev}
        aria-label="Previous Image"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity focus:opacity-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Image"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity focus:opacity-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Position indicators */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md">
        {validImages.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            aria-label={`Jump to image ${idx + 1}`}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-4 h-1.5 bg-violet-400'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
