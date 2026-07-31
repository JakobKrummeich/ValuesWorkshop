"use client";

import type { ReactNode } from "react";
import type { WorkshopSession } from "../adapters/workshopSessions";
import { MissingSession } from "./MissingSession";
import { useWorkshopSession } from "./useWorkshopSession";

export function SessionBoundary<TSession extends WorkshopSession>({
  createSession,
  children,
}: {
  createSession: (sessionIdentity: string) => TSession;
  children: (session: TSession) => ReactNode;
}) {
  const { session, isSessionIdentityMissing } =
    useWorkshopSession(createSession);

  if (isSessionIdentityMissing) {
    return <MissingSession />;
  }

  if (session === null) {
    return null;
  }

  return children(session);
}
