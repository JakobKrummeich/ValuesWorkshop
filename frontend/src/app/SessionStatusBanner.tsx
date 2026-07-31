"use client";

import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../domain/workshopState";
import styles from "./SessionStatusBanner.module.css";
import { useSessionStatusBanner } from "./useSessionStatusBanner";

export function SessionStatusBanner({
  sessionState,
}: {
  sessionState: SessionStatePort<PhasedWorkshopState>;
}) {
  const { connectionState, phase } = useSessionStatusBanner(sessionState);

  return (
    <p className={styles.banner}>
      <span data-testid="phase">
        {phase === null ? "Waiting for the workshop\u2026" : `Phase ${phase}`}
      </span>
      <span className={styles.connection} data-testid="connection">
        {connectionState}
      </span>
    </p>
  );
}
