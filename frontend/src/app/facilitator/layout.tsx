"use client";

import type { ReactNode } from "react";
import { createFacilitatorSession } from "../../adapters/workshopSessions";
import { AuthGuard } from "../AuthGuard";
import { MissingSession } from "../MissingSession";
import { useWorkshopSession } from "../useWorkshopSession";
import { FacilitatorDependencyProvider } from "./dependencies";
import "./tokens.facilitator.css";

export default function FacilitatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, isSessionIdentityMissing } = useWorkshopSession(
    createFacilitatorSession,
  );

  if (isSessionIdentityMissing) {
    return <MissingSession />;
  }

  return (
    <AuthGuard>
      {session !== null && (
        <FacilitatorDependencyProvider
          dependencies={{
            sessionState: session.sessionState,
            lifecycle: session.lifecycle,
          }}
        >
          <div className="screenFacilitator">{children}</div>
        </FacilitatorDependencyProvider>
      )}
    </AuthGuard>
  );
}
