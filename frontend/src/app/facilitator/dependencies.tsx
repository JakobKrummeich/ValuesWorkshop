"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FacilitatorLifecyclePort } from "../../domain/ports/facilitator/lifecyclePort";
import type { FacilitatorQuizControlPort } from "../../domain/ports/facilitator/quizControlPort";
import type { FacilitatorSessionStatePort } from "../../domain/ports/facilitator/sessionStatePort";

export interface FacilitatorDependencies {
  sessionStatePort: FacilitatorSessionStatePort;
  lifecycle: FacilitatorLifecyclePort;
  quizControl: FacilitatorQuizControlPort;
}

const FacilitatorDependencyContext =
  createContext<FacilitatorDependencies | null>(null);

export function FacilitatorDependencyProvider({
  dependencies,
  children,
}: {
  dependencies: FacilitatorDependencies;
  children: ReactNode;
}) {
  return (
    <FacilitatorDependencyContext.Provider value={dependencies}>
      {children}
    </FacilitatorDependencyContext.Provider>
  );
}

export function useFacilitatorDependencies(): FacilitatorDependencies {
  const dependencies = useContext(FacilitatorDependencyContext);
  if (dependencies === null) {
    throw new Error(
      "useFacilitatorDependencies requires FacilitatorDependencyProvider",
    );
  }
  return dependencies;
}
