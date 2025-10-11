import { useCallback, useEffect, useRef, useState } from "react";

const isBrowser = typeof window !== "undefined";

export interface UseScrubberOptions {
  duration: number;           // total length in seconds
  initialTime?: number;       // start position in seconds
  onChange?: (time: number) => void; // called whenever time updates
}

export function useScrubber({
  duration,
  initialTime = 0,
  onChange,
}: UseScrubberOptions) {
  // Clamp initial value to [0, duration]
  const [currentTime, setCurrentTime] = useState(() =>
    Math.max(0, Math.min(initialTime, duration)),
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Animation frame state
  const frameRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Keep latest onChange without re-subscribing the RAF effect
  const onChangeRef = useRef<typeof onChange>(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Seek/scrub to a time, clamped to [0, duration]
  const scrubTo = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, duration));
      setCurrentTime(clamped);
      onChangeRef.current?.(clamped);
    },
    [duration],
  );

  // Play/pause control (kept compatible with your original signature)
  const togglePlay = useCallback((play: boolean) => {
    setIsPlaying(play);

    if (!isBrowser) return;

    // Reset timing state whenever play state changes
    if (!play && frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastTsRef.current = null;
  }, []);

  // Optional convenience methods
  const play = useCallback(() => togglePlay(true), [togglePlay]);
  const pause = useCallback(() => togglePlay(false), [togglePlay]);

  // Animation loop
  useEffect(() => {
    if (!isBrowser || !isPlaying || duration <= 0) return;

    const loop = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      const delta = (ts - last) / 1000; // ms -> s
      lastTsRef.current = ts;

      setCurrentTime((prev) => {
        let next = prev + delta;
        if (next >= duration) {
          next = duration;         // stop at the end
          setIsPlaying(false);
        }
        onChangeRef.current?.(next);
        return next;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTsRef.current = null;
    };
  }, [isPlaying, duration]);

  return {
    currentTime,
    isPlaying,
    scrubTo,
    togglePlay,
    play,
    pause,
  };
}
