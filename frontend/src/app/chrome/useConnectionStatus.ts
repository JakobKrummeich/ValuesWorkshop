"use client";

import { ConnectionState } from "../../domain/connectionState";
import { connectionStateMessage } from "../../domain/i18n/connectionStateMessage";
import { useTranslation } from "../i18n/useTranslation";

export interface ConnectionStatusResult {
  text: string;
  isConnected: boolean;
}

export function useConnectionStatus(
  connectionState: ConnectionState,
): ConnectionStatusResult {
  const { translate } = useTranslation();

  return {
    text: translate(connectionStateMessage(connectionState)),
    isConnected: connectionState === ConnectionState.Connected,
  };
}
