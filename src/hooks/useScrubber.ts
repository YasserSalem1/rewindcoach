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
  const frameRef = useRef<number>();
  const lastFrameRef = useRef<number>();

  const scrubTo = useCallback(
    (time: number) => {
      const clamped = Math.min(Math.max(time, 0), duration);
      setCurrentTime(clamped);
      onChange?.(clamped);
    },
    [duration, onChange],
  );

  const togglePlay = useCallback(
    (play: boolean) => {
      setIsPlaying(play);
      if (!play) {
        lastFrameRef.current = undefined;
      }
    },
    [],
  );

  useEffect(() => {
    if (!isBrowser() || !isPlaying) {
      return;
    }

    const loop = (timestamp: number) => {
      if (lastFrameRef.current === undefined) {
        lastFrameRef.current = timestamp;
      }

      const delta = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;

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
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [duration, isPlaying, onChange, togglePlay]);

  return {
    currentTime,
    isPlaying,
    scrubTo,
    togglePlay,
  };
}
