"use client";

import { useEffect, useState } from "react";
import { motionIsAllowed } from "../adapters/motionPreference";
import {
  motionRevealMilliseconds,
  motionStaggerMilliseconds,
} from "../shared/motion";

export interface RevealChoreography {
  labelsVisible: boolean;
}

export function revealDurationOf(rowCount: number): number {
  return rowCount * motionStaggerMilliseconds + motionRevealMilliseconds;
}

export function useRevealChoreography(rowCount: number): RevealChoreography {
  const [barsHaveGrown, setBarsHaveGrown] = useState(false);
  const animate = motionIsAllowed();

  useEffect(() => {
    if (!animate) {
      return undefined;
    }

    const timer = setTimeout(
      () => setBarsHaveGrown(true),
      revealDurationOf(rowCount),
    );

    return () => clearTimeout(timer);
  }, [animate, rowCount]);

  return { labelsVisible: !animate || barsHaveGrown };
}
