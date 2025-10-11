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

  const togglePlay = useCallback(
    (play: boolean) => {
      setIsPlaying(play);
      if (!play) {
        // your original logic:
        // note: this uses `undefined` sentinel even though the ref type is number|null
        // keep as-is since you're reverting
        // @ts-ignore
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
      // @ts-ignore matching your original undefined check
      if (lastFrameRef.current === undefined) {
        // @ts-ignore
        lastFrameRef.current = timestamp;
      }

      // @ts-ignore
      const delta = (timestamp - lastFrameRef.current) / 1000;
      // @ts-ignore
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
      // keep original guard
      // @ts-ignore
      if (frameRef.current !== undefined) {
        // @ts-ignore
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
