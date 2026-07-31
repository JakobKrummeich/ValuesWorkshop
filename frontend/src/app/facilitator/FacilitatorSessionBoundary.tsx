"use client";

import type { ReactNode } from "react";
import { createFacilitatorSession } from "../../adapters/workshopSessions";
import { MissingSession } from "../MissingSession";
import { useWorkshopSession } from "../useWorkshopSession";
import { FacilitatorDependencyProvider } from "./dependencies";

export function FacilitatorSessionBoundary({
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

  if (session === null) {
    return null;
  }

  return (
    <FacilitatorDependencyProvider
      dependencies={{
        sessionState: session.sessionState,
        lifecycle: session.lifecycle,
      }}
    >
      <div className="screenFacilitator">{children}</div>
    </FacilitatorDependencyProvider>
  );
}
