import React, { useEffect, useRef, useState } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import heroAnimationData from '../../assets/hero-animation.json';

interface LottieHeroAnimationProps {
  className?: string;
}

export function LottieHeroAnimation({ className = '' }: LottieHeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animInstanceRef = useRef<AnimationItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Destroy previous instance if any
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
      }

      const instance = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: heroAnimationData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
          hideOnTransparent: true,
        },
      });

      animInstanceRef.current = instance;

      instance.addEventListener('DOMLoaded', () => {
        setIsLoaded(true);
      });

      instance.addEventListener('data_failed', () => {
        setHasError(true);
      });
    } catch (err) {
      console.error('Failed to initialize hero Lottie animation:', err);
      setHasError(true);
    }

    return () => {
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
        animInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`relative w-full flex items-center justify-center select-none ${className}`}
      role="img"
      aria-label="LinkPulse Real-Time URL Routing and Analytics Animation"
    >
      {/* Background soft ambient badge / frame */}
      <div className="relative w-full max-w-[280px] min-[360px]:max-w-[320px] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[480px] aspect-square rounded-2xl bg-[#faf9f6] border border-neutral-200/90 shadow-sm p-3.5 sm:p-6 flex flex-col items-center justify-between overflow-hidden">
        {/* Subtle header label */}
        <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-neutral-500 border-b border-neutral-200/70 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-neutral-700 uppercase tracking-wider">Live Engine</span>
          </div>
          <span className="text-neutral-400">4.0s loop · Vector SVG</span>
        </div>

        {/* Lottie Animation Canvas Container */}
        <div className="relative w-full flex-1 flex items-center justify-center my-2 sm:my-3">
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin"></div>
            </div>
          )}

          {hasError ? (
            <div className="text-center p-2 text-xs text-neutral-500">
              <p className="font-medium text-neutral-700">Animation preview</p>
              <p>Real-time redirect & link telemetry</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className={`w-full h-full max-h-[190px] min-[360px]:max-h-[220px] sm:max-h-[300px] flex items-center justify-center transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>

        {/* Subtle footer telemetry ticker */}
        <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 sm:pt-2.5 border-t border-neutral-200/70 text-center font-mono text-[9px] min-[360px]:text-[10px] sm:text-[11px]">
          <div className="bg-white/80 py-1 sm:py-1.5 px-1 sm:px-2 rounded-lg border border-neutral-200/60">
            <div className="text-neutral-400">Latency</div>
            <div className="font-bold text-neutral-800 tabular-nums">&lt;12ms</div>
          </div>
          <div className="bg-white/80 py-1 sm:py-1.5 px-1 sm:px-2 rounded-lg border border-neutral-200/60">
            <div className="text-neutral-400">Redirect</div>
            <div className="font-bold text-neutral-800">301/308</div>
          </div>
          <div className="bg-white/80 py-1 sm:py-1.5 px-1 sm:px-2 rounded-lg border border-neutral-200/60">
            <div className="text-neutral-400">Precision</div>
            <div className="font-bold text-neutral-800">100%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
