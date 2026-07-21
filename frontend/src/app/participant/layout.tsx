"use client";

import type { ReactNode } from "react";
import { stubParticipantGateway } from "../../adapters/stubParticipantGateway";
import { ParticipantPortsProvider } from "./ports";

export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <ParticipantPortsProvider gateway={stubParticipantGateway}>
      {children}
    </ParticipantPortsProvider>
  );
}
