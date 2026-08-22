"use client";

import { useEffect, useState } from "react";

export const formationProgressMilliseconds = 3000;

export interface FormationProgressGate {
  isFormationProgressRunning: boolean;
}

export function useFormationProgressGate(
  isPhaseEntryObserved: boolean,
): FormationProgressGate {
  const [isFormationProgressDone, setFormationProgressDone] = useState(false);

  useEffect(() => {
    if (!isPhaseEntryObserved) {
      return undefined;
    }

    const completionTimer = setTimeout(
      () => setFormationProgressDone(true),
      formationProgressMilliseconds,
    );

    return () => clearTimeout(completionTimer);
  }, [isPhaseEntryObserved]);

  return {
    isFormationProgressRunning:
      isPhaseEntryObserved && !isFormationProgressDone,
  };
}
