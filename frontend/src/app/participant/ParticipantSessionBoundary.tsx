"use client";

import type { ReactNode } from "react";
import { createParticipantSession } from "../../adapters/workshopSessions";
import { MissingSession } from "../MissingSession";
import { useWorkshopSession } from "../useWorkshopSession";
import { ParticipantDependencyProvider } from "./dependencies";

export function ParticipantSessionBoundary({
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

  if (session === null) {
    return null;
  }

  return (
    <ParticipantDependencyProvider
      dependencies={{ sessionState: session.sessionState }}
    >
      <div className="screenParticipant">{children}</div>
    </ParticipantDependencyProvider>
  );
}
