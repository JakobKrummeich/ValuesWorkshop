"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PresenterSessionStatePort } from "../../domain/ports/presenter/sessionStatePort";

export interface PresenterDependencies {
  sessionStatePort: PresenterSessionStatePort;
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
