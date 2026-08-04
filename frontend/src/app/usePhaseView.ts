"use client";

import { useEffect, useState } from "react";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../domain/workshopState";

export function usePhaseView<TState extends PhasedWorkshopState>(
  sessionState: SessionStatePort<TState>,
): TState | null {
  const [state, setState] = useState<TState | null>(null);

  useEffect(() => {
    const subscription = sessionState.workshopState.subscribe(setState);

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionState]);

  return state;
}
