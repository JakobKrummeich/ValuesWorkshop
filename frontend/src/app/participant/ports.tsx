"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ParticipantGateway } from "../../ports/participantGateway";

const ParticipantGatewayContext = createContext<ParticipantGateway | null>(null);

export function ParticipantPortsProvider({
  gateway,
  children,
}: {
  gateway: ParticipantGateway;
  children: ReactNode;
}) {
  return (
    <ParticipantGatewayContext.Provider value={gateway}>
      {children}
    </ParticipantGatewayContext.Provider>
  );
}

export function useParticipantGateway(): ParticipantGateway {
  const gateway = useContext(ParticipantGatewayContext);
  if (gateway === null) {
    throw new Error("useParticipantGateway requires ParticipantPortsProvider");
  }
  return gateway;
}
