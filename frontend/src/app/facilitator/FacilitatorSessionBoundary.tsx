"use client";

import type { ReactNode } from "react";
import { createFacilitatorSession } from "../../adapters/workshopSessions";
import { SessionBoundary } from "../SessionBoundary";
import { FacilitatorDependencyProvider } from "./dependencies";

export function FacilitatorSessionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionBoundary createSession={createFacilitatorSession}>
      {(session) => (
        <FacilitatorDependencyProvider
          dependencies={{
            sessionState: session.sessionState,
            lifecycle: session.lifecycle,
          }}
        >
          <div className="screenFacilitator">{children}</div>
        </FacilitatorDependencyProvider>
      )}
    </SessionBoundary>
  );
}
