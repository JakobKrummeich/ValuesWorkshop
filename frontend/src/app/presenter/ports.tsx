"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PresenterGateway } from "../../ports/presenterGateway";

const PresenterGatewayContext = createContext<PresenterGateway | null>(null);

/** DI context of the presenter screen group: injects its port implementations. */
export function PresenterPortsProvider({
  gateway,
  children,
}: {
  gateway: PresenterGateway;
  children: ReactNode;
}) {
  return (
    <PresenterGatewayContext.Provider value={gateway}>
      {children}
    </PresenterGatewayContext.Provider>
  );
}

export function usePresenterGateway(): PresenterGateway {
  const gateway = useContext(PresenterGatewayContext);
  if (gateway === null) {
    throw new Error("usePresenterGateway requires PresenterPortsProvider");
  }
  return gateway;
}
