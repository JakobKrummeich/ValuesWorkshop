"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FacilitatorGateway } from "../../ports/facilitatorGateway";

const FacilitatorGatewayContext = createContext<FacilitatorGateway | null>(null);

/** DI context of the facilitator screen group: injects its port implementations. */
export function FacilitatorPortsProvider({
  gateway,
  children,
}: {
  gateway: FacilitatorGateway;
  children: ReactNode;
}) {
  return (
    <FacilitatorGatewayContext.Provider value={gateway}>
      {children}
    </FacilitatorGatewayContext.Provider>
  );
}

export function useFacilitatorGateway(): FacilitatorGateway {
  const gateway = useContext(FacilitatorGatewayContext);
  if (gateway === null) {
    throw new Error("useFacilitatorGateway requires FacilitatorPortsProvider");
  }
  return gateway;
}
