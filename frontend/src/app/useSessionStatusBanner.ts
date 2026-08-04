"use client";

import { useEffect, useState } from "react";
import { Subscription } from "rxjs";
import { ConnectionState } from "../domain/connectionState";
import { connectionStateMessage } from "../domain/i18n/connectionStateMessage";
import { MessageKey } from "../domain/i18n/messages";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { Phase } from "../domain/phases";
import type { PhasedWorkshopState } from "../domain/workshopState";
import { useTranslation } from "./i18n/useTranslation";

export interface SessionStatusBannerResult {
  connectionText: string;
  phaseText: string;
}

export function useSessionStatusBanner(
  sessionState: SessionStatePort<PhasedWorkshopState>,
): SessionStatusBannerResult {
  const [connectionState, setConnectionState] = useState(
    ConnectionState.Connecting,
  );
  const [phase, setPhase] = useState<Phase | null>(null);
  const { translate } = useTranslation();

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

  return {
    connectionText: translate(connectionStateMessage(connectionState)),
    phaseText:
      phase === null
        ? translate(MessageKey.SessionWaiting)
        : translate(MessageKey.SessionPhase, { phase }),
  };
}
