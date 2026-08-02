"use client";

import type { ReactNode } from "react";
import type { WorkshopSession } from "../adapters/workshopSessions";
import { MissingSession } from "./MissingSession";
import { useWorkshopSession } from "./useWorkshopSession";

export function SessionBoundary<TSession extends WorkshopSession>({
  createSession,
  missingSession = <MissingSession />,
  children,
}: {
  createSession: (sessionIdentity: string) => TSession;
  missingSession?: ReactNode;
  children: (session: TSession) => ReactNode;
}) {
  const { session, isSessionIdentityMissing } =
    useWorkshopSession(createSession);

  if (isSessionIdentityMissing) {
    return missingSession;
  }

  if (session === null) {
    return null;
  }

  return children(session);
}
