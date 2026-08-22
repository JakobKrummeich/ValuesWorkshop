"use client";

import { useEffect, useState } from "react";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../domain/workshopState";

export interface PhaseViewModel<TState extends PhasedWorkshopState> {
  state: TState | null;
  isPhaseEntryObserved: boolean;
}

export function usePhaseView<TState extends PhasedWorkshopState>(
  sessionStatePort: SessionStatePort<TState>,
): PhaseViewModel<TState> {
  const [model, setModel] = useState<PhaseViewModel<TState>>({
    state: null,
    isPhaseEntryObserved: false,
  });

  useEffect(() => {
    const subscription = sessionStatePort.workshopState.subscribe((state) =>
      setModel((previous) => ({
        state,
        isPhaseEntryObserved:
          previous.state !== null && previous.state.phase !== state.phase,
      })),
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionStatePort]);

  return model;
}
