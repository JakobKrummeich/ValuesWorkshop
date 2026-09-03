"use client";

import { useEffect, useState } from "react";
import type { ParticipantSessionStatePort } from "../../domain/ports/participant/sessionStatePort";
import type { GroupName } from "../../domain/workshopState";
import { rememberOwnGroupName } from "./ownGroupMemory";

export function useOwnGroupMemory(
  sessionStatePort: ParticipantSessionStatePort,
): GroupName | null {
  const [ownGroupName, setOwnGroupName] = useState<GroupName | null>(null);

  useEffect(() => {
    const subscription = sessionStatePort.workshopState.subscribe((state) =>
      setOwnGroupName((remembered) => rememberOwnGroupName(remembered, state)),
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionStatePort]);

  return ownGroupName;
}
