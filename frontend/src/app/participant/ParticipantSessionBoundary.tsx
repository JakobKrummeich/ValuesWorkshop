"use client";

import type { ReactNode } from "react";
import { createParticipantSession } from "../../adapters/workshopSessions";
import { SessionBoundary } from "../SessionBoundary";
import { ParticipantDependencyProvider } from "./dependencies";

export function ParticipantSessionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionBoundary createSession={createParticipantSession}>
      {(session) => (
        <ParticipantDependencyProvider
          dependencies={{
            sessionStatePort: session.sessionStatePort,
            quizPort: session.quizPort,
            selectionPort: session.selectionPort,
          }}
        >
          <div className="screenParticipant">{children}</div>
        </ParticipantDependencyProvider>
      )}
    </SessionBoundary>
  );
}
