"use client";

import { useCallback, useState } from "react";

export interface ParticipantGroupFormationScreenModel {
  isFormationProgressRunning: boolean;
  completeFormationProgress: () => void;
}

export function useParticipantGroupFormationScreen(
  isPhaseEntryObserved: boolean,
): ParticipantGroupFormationScreenModel {
  const [isFormationProgressRunning, setIsFormationProgressRunning] =
    useState(isPhaseEntryObserved);

  const completeFormationProgress = useCallback(
    () => setIsFormationProgressRunning(false),
    [],
  );

  return { isFormationProgressRunning, completeFormationProgress };
}
