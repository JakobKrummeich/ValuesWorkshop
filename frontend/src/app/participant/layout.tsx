"use client";

import type { ReactNode } from "react";
import { stubParticipantGateway } from "../../adapters/stubParticipantGateway";
import { ParticipantDependencyProvider } from "./dependencies";

export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <ParticipantDependencyProvider dependencies={{ gateway: stubParticipantGateway }}>
      {children}
    </ParticipantDependencyProvider>
  );
}
