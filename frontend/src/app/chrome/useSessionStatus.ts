"use client";

import { useEffect, useState } from "react";
import { Subscription } from "rxjs";
import { ConnectionState } from "../../domain/connectionState";
import type { Phase } from "../../domain/phases";
import type { SessionStatePort } from "../../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../../domain/workshopState";

export interface SessionStatus {
  phase: Phase | null;
  connectionState: ConnectionState;
}

export function useSessionStatus(
  sessionStatePort: SessionStatePort<PhasedWorkshopState>,
): SessionStatus {
  const [connectionState, setConnectionState] = useState(
    ConnectionState.Connecting,
  );
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    const subscriptions = new Subscription();
    subscriptions.add(
      sessionStatePort.connectionState.subscribe(setConnectionState),
    );
    subscriptions.add(
      sessionStatePort.workshopState.subscribe((state) =>
        setPhase(state.phase),
      ),
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [sessionStatePort]);

  return { phase, connectionState };
}
