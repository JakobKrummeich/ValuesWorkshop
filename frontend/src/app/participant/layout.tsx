"use client";

import type { ReactNode } from "react";
import { stubParticipantGateway } from "../../adapters/stubParticipantGateway";
import { AuthGuard } from "../AuthGuard";
import { ParticipantDependencyProvider } from "./dependencies";
import "./tokens.participant.css";

export default function ParticipantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <ParticipantDependencyProvider
        dependencies={{ gateway: stubParticipantGateway }}
      >
        <div className="screenParticipant">{children}</div>
      </ParticipantDependencyProvider>
    </AuthGuard>
  );
}
