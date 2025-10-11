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
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

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

    if (!isBrowser) return;

    // Reset timing state whenever play state changes
    if (!play && frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastTsRef.current = null;
  }, []);

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
      // keep original guard
      // @ts-ignore
      if (frameRef.current !== undefined) {
        // @ts-ignore
        window.cancelAnimationFrame(frameRef.current);
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
