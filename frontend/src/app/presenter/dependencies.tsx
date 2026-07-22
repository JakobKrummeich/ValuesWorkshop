"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PresenterGateway } from "../../domain/ports/presenterGateway";

export interface PresenterDependencies {
  gateway: PresenterGateway;
}

const PresenterDependencyContext = createContext<PresenterDependencies | null>(
  null,
);

export function PresenterDependencyProvider({
  dependencies,
  children,
}: {
  dependencies: PresenterDependencies;
  children: ReactNode;
}) {
  return (
    <PresenterDependencyContext.Provider value={dependencies}>
      {children}
    </PresenterDependencyContext.Provider>
  );
}

export function usePresenterDependencies(): PresenterDependencies {
  const dependencies = useContext(PresenterDependencyContext);
  if (dependencies === null) {
    throw new Error(
      "usePresenterDependencies requires PresenterDependencyProvider",
    );
  }
  return dependencies;
}
