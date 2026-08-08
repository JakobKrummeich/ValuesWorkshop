"use client";

import { useEffect, useState } from "react";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../domain/workshopState";

export function usePhaseView<TState extends PhasedWorkshopState>(
  sessionStatePort: SessionStatePort<TState>,
): TState | null {
  const [state, setState] = useState<TState | null>(null);

  useEffect(() => {
    const subscription = sessionStatePort.workshopState.subscribe(setState);

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionStatePort]);

  return state;
}
