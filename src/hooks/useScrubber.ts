import { useCallback, useEffect, useRef, useState } from "react";

const isBrowser = () => typeof window !== "undefined";

export interface UseScrubberOptions {
  duration: number;
  initialTime?: number;
  onChange?: (time: number) => void;
}

export function useScrubber({
  duration,
  initialTime = 0,
  onChange,
}: UseScrubberOptions) {
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const scrubTo = useCallback(
    (time: number) => {
      const clamped = Math.min(Math.max(time, 0), duration);
      setCurrentTime(clamped);
      onChange?.(clamped);
    },
    [duration, onChange],
  );

  const togglePlay = useCallback((play: boolean) => {
    setIsPlaying(play);
    if (!play) {
      lastFrameRef.current = null;
      if (frameRef.current !== null && isBrowser()) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!isBrowser() || !isPlaying) {
      return;
    }

    const loop = (timestamp: number) => {
      const previousTimestamp = lastFrameRef.current ?? timestamp;
      lastFrameRef.current = timestamp;
      const delta = (timestamp - previousTimestamp) / 1000;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= duration) {
          togglePlay(false);
          onChange?.(duration);
          return duration;
        }
        onChange?.(next);
        return next;
      });

      frameRef.current = window.requestAnimationFrame(loop);
    };

    frameRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastFrameRef.current = null;
    };
  }, [duration, isPlaying, onChange, togglePlay]);

  return {
    currentTime,
    isPlaying,
    scrubTo,
    togglePlay,
  };
}
