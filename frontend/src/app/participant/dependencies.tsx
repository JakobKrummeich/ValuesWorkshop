"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ParticipantQuizPort } from "../../domain/ports/participant/quizPort";
import type { ParticipantSelectionPort } from "../../domain/ports/participant/selectionPort";
import type { ParticipantSessionStatePort } from "../../domain/ports/participant/sessionStatePort";

export interface ParticipantDependencies {
  sessionStatePort: ParticipantSessionStatePort;
  quizPort: ParticipantQuizPort;
  selectionPort: ParticipantSelectionPort;
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
