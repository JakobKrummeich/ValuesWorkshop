"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { currentSessionIdentity } from "../adapters/browserLocation";
import type { WorkshopSession } from "../adapters/workshopSessions";

export interface WorkshopSessionResult<TSession> {
  session: TSession | null;
  isSessionIdentityMissing: boolean;
}

function subscribeToNothing() {
  return () => undefined;
}

function unknownOnTheServer() {
  return undefined;
}

export function useWorkshopSession<TSession extends WorkshopSession>(
  createSession: (sessionIdentity: string) => TSession,
): WorkshopSessionResult<TSession> {
  const sessionIdentity = useSyncExternalStore(
    subscribeToNothing,
    currentSessionIdentity,
    unknownOnTheServer,
  );

  const session = useMemo(
    () =>
      sessionIdentity === null || sessionIdentity === undefined
        ? null
        : createSession(sessionIdentity),
    [sessionIdentity, createSession],
  );

  useEffect(() => {
    if (session === null) {
      return;
    }

    const subscription = session.start().subscribe({
      error(error) {
        console.error("The workshop connection could not be started", error);
      },
    });

    return () => {
      subscription.unsubscribe();
      session.close().subscribe({ error: () => undefined });
    };
  }, [session]);

  return { session, isSessionIdentityMissing: sessionIdentity === null };
}
