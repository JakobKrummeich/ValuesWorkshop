"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FacilitatorConclusionControlPort } from "../../domain/ports/facilitator/conclusionControlPort";
import type { FacilitatorGroupWorkControlPort } from "../../domain/ports/facilitator/groupWorkControlPort";
import type { FacilitatorWalkControlPort } from "../../domain/ports/facilitator/walkControlPort";
import type { FacilitatorLifecyclePort } from "../../domain/ports/facilitator/lifecyclePort";
import type { FacilitatorQuizControlPort } from "../../domain/ports/facilitator/quizControlPort";
import type { FacilitatorSessionStatePort } from "../../domain/ports/facilitator/sessionStatePort";
import type { FacilitatorVotingControlPort } from "../../domain/ports/facilitator/votingControlPort";

export interface FacilitatorDependencies {
  sessionStatePort: FacilitatorSessionStatePort;
  lifecyclePort: FacilitatorLifecyclePort;
  quizControlPort: FacilitatorQuizControlPort;
  groupWorkControlPort: FacilitatorGroupWorkControlPort;
  walkControlPort: FacilitatorWalkControlPort;
  votingControlPort: FacilitatorVotingControlPort;
  conclusionControlPort: FacilitatorConclusionControlPort;
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
