"use client";

import { useEffect, useState } from "react";
import { Subscription } from "rxjs";
import { ConnectionState } from "../domain/connectionState";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { Phase } from "../domain/phases";
import type { PhasedWorkshopState } from "../domain/workshopState";

export interface SessionStatusBannerResult {
  connectionState: ConnectionState;
  phase: Phase | null;
}

export function useSessionStatusBanner(
  sessionState: SessionStatePort<PhasedWorkshopState>,
): SessionStatusBannerResult {
  const [connectionState, setConnectionState] = useState(
    ConnectionState.Connecting,
  );
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    const subscriptions = new Subscription();
    subscriptions.add(
      sessionState.connectionState.subscribe(setConnectionState),
    );
    subscriptions.add(
      sessionState.workshopState.subscribe((state) => setPhase(state.phase)),
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [sessionState]);

  return { connectionState, phase };
}
