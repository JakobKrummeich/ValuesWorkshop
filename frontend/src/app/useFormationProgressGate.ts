"use client";

import { useCallback, useState } from "react";

export interface FormationProgressGate {
  isFormationProgressRunning: boolean;
  completeFormationProgress: () => void;
}

export function useFormationProgressGate(
  isPhaseEntryObserved: boolean,
): FormationProgressGate {
  const [isFormationProgressDone, setFormationProgressDone] = useState(false);

  const completeFormationProgress = useCallback(
    () => setFormationProgressDone(true),
    [],
  );

  return {
    isFormationProgressRunning:
      isPhaseEntryObserved && !isFormationProgressDone,
    completeFormationProgress,
  };
}
