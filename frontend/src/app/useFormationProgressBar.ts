"use client";

import { useEffect } from "react";

export const formationProgressMilliseconds = 3000;

export function useFormationProgressBar(onProgressComplete: () => void): void {
  useEffect(() => {
    const completionTimer = setTimeout(
      onProgressComplete,
      formationProgressMilliseconds,
    );

    return () => clearTimeout(completionTimer);
  }, [onProgressComplete]);
}
