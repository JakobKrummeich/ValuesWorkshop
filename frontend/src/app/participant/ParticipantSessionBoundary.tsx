"use client";

import type { ReactNode } from "react";
import { createParticipantSession } from "../../adapters/workshopSessions";
import { SessionBoundary } from "../SessionBoundary";
import { ParticipantDependencyProvider } from "./dependencies";
import { OwnGroupMemoryProvider } from "./OwnGroupMemoryProvider";

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
            groupWorkPort: session.groupWorkPort,
            votingPort: session.votingPort,
          }}
        >
          <OwnGroupMemoryProvider sessionStatePort={session.sessionStatePort}>
            {children}
          </OwnGroupMemoryProvider>
        </ParticipantDependencyProvider>
      )}
    </SessionBoundary>
  );
}
