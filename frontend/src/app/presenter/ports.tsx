"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PresenterGateway } from "../../ports/presenterGateway";

const PresenterGatewayContext = createContext<PresenterGateway | null>(null);

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
