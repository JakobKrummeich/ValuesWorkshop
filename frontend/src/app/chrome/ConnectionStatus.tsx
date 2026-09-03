"use client";

import type { SessionStatePort } from "../../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../../domain/workshopState";
import styles from "./ConnectionStatus.module.css";
import { useConnectionStatus } from "./useConnectionStatus";

export enum ConnectionStatusVariant {
  Wall = "wall",
  Phone = "phone",
  Sidebar = "sidebar",
}

export function ConnectionStatus({
  sessionStatePort,
  variant,
}: {
  sessionStatePort: SessionStatePort<PhasedWorkshopState>;
  variant: ConnectionStatusVariant;
}) {
  const { text, isConnected } = useConnectionStatus(sessionStatePort);

  return (
    <p
      className={`${styles.status} ${styles[variant]} ${
        isConnected ? styles.connected : styles.unhealthy
      }`}
      role="status"
    >
      <span className={styles.dot} aria-hidden="true" />
      <span data-testid="connection">{text}</span>
    </p>
  );
}
