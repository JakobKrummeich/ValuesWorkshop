"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ParticipantSessionStatePort } from "../../domain/ports/participant/sessionStatePort";
import type { GroupName } from "../../domain/workshopState";
import { useOwnGroupMemory } from "./useOwnGroupMemory";

const OwnGroupMemoryContext = createContext<GroupName | null>(null);

export function OwnGroupMemoryProvider({
  sessionStatePort,
  children,
}: {
  sessionStatePort: ParticipantSessionStatePort;
  children: ReactNode;
}) {
  const ownGroupName = useOwnGroupMemory(sessionStatePort);

  return (
    <OwnGroupMemoryContext.Provider value={ownGroupName}>
      {children}
    </OwnGroupMemoryContext.Provider>
  );
}

export function useRememberedOwnGroup(): GroupName | null {
  return useContext(OwnGroupMemoryContext);
}
