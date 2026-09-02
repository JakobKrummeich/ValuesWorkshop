"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "../AuthGuard";
import { ParticipantSessionBoundary } from "./ParticipantSessionBoundary";
import "./tokens.participant.css";

export default function ParticipantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="screenParticipant">
      <AuthGuard>
        <ParticipantSessionBoundary>{children}</ParticipantSessionBoundary>
      </AuthGuard>
    </div>
  );
}
