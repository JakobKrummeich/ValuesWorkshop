"use client";

import type { ReactNode } from "react";
import { stubParticipantGateway } from "../../adapters/stubParticipantGateway";
import { ParticipantPortsProvider } from "./ports";

/** Composition root of the participant screen group: wires adapters into ports. */
export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <ParticipantPortsProvider gateway={stubParticipantGateway}>
      {children}
    </ParticipantPortsProvider>
  );
}
