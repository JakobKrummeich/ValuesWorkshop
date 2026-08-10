"use client";

import type { ReactNode } from "react";
import { facilitatorSessionCreation } from "../../adapters/sessionCreationAdapter";
import { createFacilitatorSession } from "../../adapters/workshopSessions";
import { SessionBoundary } from "../SessionBoundary";
import { FacilitatorDependencyProvider } from "./dependencies";
import { OpenSessionForm } from "./OpenSessionForm";

export function FacilitatorSessionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionBoundary
      createSession={createFacilitatorSession}
      missingSession={
        <div className="screenFacilitator">
          <OpenSessionForm sessionCreation={facilitatorSessionCreation} />
        </div>
      }
    >
      {(session) => (
        <FacilitatorDependencyProvider
          dependencies={{
            sessionStatePort: session.sessionStatePort,
            lifecycle: session.lifecycle,
            quizControl: session.quizControl,
          }}
        >
          <div className="screenFacilitator">{children}</div>
        </FacilitatorDependencyProvider>
      )}
    </SessionBoundary>
  );
}
