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
  const { connectionText, phaseText } = useSessionStatusBanner(sessionState);

  return (
    <p className={styles.banner}>
      <span data-testid="phase">{phaseText}</span>
      <span className={styles.connection} data-testid="connection">
        {connectionText}
      </span>
    </p>
  );
}
