"use client";

import { useEffect, useState } from "react";
import { motionIsAllowed } from "../../../../adapters/motionPreference";
import { revealDurationOf } from "../../../useRevealChoreography";

export function useRevealCelebration(actionCount: number): boolean {
  const [isCelebrating, setIsCelebrating] = useState(false);
  const animate = motionIsAllowed();

  useEffect(() => {
    if (!animate) {
      return undefined;
    }

    const timer = setTimeout(
      () => setIsCelebrating(true),
      revealDurationOf(actionCount),
    );

    return () => clearTimeout(timer);
  }, [animate, actionCount]);

  return animate && isCelebrating;
}
