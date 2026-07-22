"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ParticipantGateway } from "../../domain/participantGateway";

export interface ParticipantDependencies {
  gateway: ParticipantGateway;
}

const ParticipantDependencyContext =
  createContext<ParticipantDependencies | null>(null);

export function ParticipantDependencyProvider({
  dependencies,
  children,
}: {
  dependencies: ParticipantDependencies;
  children: ReactNode;
}) {
  return (
    <ParticipantDependencyContext.Provider value={dependencies}>
      {children}
    </ParticipantDependencyContext.Provider>
  );
}

export function useParticipantDependencies(): ParticipantDependencies {
  const dependencies = useContext(ParticipantDependencyContext);
  if (dependencies === null) {
    throw new Error(
      "useParticipantDependencies requires ParticipantDependencyProvider",
    );
  }
  return dependencies;
}
