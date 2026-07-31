"use client";

import type { ReactNode } from "react";
import { createParticipantSession } from "../../adapters/workshopSessions";
import { AuthGuard } from "../AuthGuard";
import { MissingSession } from "../MissingSession";
import { useWorkshopSession } from "../useWorkshopSession";
import { ParticipantDependencyProvider } from "./dependencies";
import "./tokens.participant.css";

export default function ParticipantLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, isSessionIdentityMissing } = useWorkshopSession(
    createParticipantSession,
  );

  if (isSessionIdentityMissing) {
    return <MissingSession />;
  }

  return (
    <AuthGuard>
      {session !== null && (
        <ParticipantDependencyProvider
          dependencies={{ sessionState: session.sessionState }}
        >
          <div className="screenParticipant">{children}</div>
        </ParticipantDependencyProvider>
      )}
    </AuthGuard>
  );
}
