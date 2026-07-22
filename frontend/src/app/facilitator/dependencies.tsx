"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FacilitatorGateway } from "../../ports/facilitatorGateway";

export interface FacilitatorDependencies {
  gateway: FacilitatorGateway;
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
