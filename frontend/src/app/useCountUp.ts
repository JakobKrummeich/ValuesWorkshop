"use client";

import { useEffect, useRef, useState } from "react";
import { motionIsAllowed } from "../adapters/motionPreference";
import { motionSlowMilliseconds } from "../shared/motion";

function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

export function useCountUp(target: number): number {
  const [displayed, setDisplayed] = useState(target);
  const displayedRef = useRef(target);
  const animate = motionIsAllowed();

  useEffect(() => {
    const from = displayedRef.current;
    if (!animate || from === target) {
      displayedRef.current = target;
      return undefined;
    }

    const startedAt = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / motionSlowMilliseconds);
      const value = Math.round(from + (target - from) * easeOut(progress));
      displayedRef.current = value;
      setDisplayed(value);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [animate, target]);

  return animate ? displayed : target;
}
