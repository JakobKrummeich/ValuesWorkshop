"use client";

import { useEffect, useState } from "react";
import { ConnectionState } from "../../domain/connectionState";
import { connectionStateMessage } from "../../domain/i18n/connectionStateMessage";
import type { SessionStatePort } from "../../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../../domain/workshopState";
import { useTranslation } from "../i18n/useTranslation";

export interface ConnectionStatusResult {
  text: string;
  isConnected: boolean;
}

export function useConnectionStatus(
  sessionStatePort: SessionStatePort<PhasedWorkshopState>,
): ConnectionStatusResult {
  const [connectionState, setConnectionState] = useState(
    ConnectionState.Connecting,
  );
  const { translate } = useTranslation();

  useEffect(() => {
    const subscription =
      sessionStatePort.connectionState.subscribe(setConnectionState);

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionStatePort]);

  return {
    text: translate(connectionStateMessage(connectionState)),
    isConnected: connectionState === ConnectionState.Connected,
  };
}
