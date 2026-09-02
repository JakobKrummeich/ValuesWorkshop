"use client";

import type { ConnectionState } from "../../domain/connectionState";
import styles from "./ConnectionStatus.module.css";
import { useConnectionStatus } from "./useConnectionStatus";

export enum ConnectionStatusVariant {
  Wall = "wall",
  Phone = "phone",
  Sidebar = "sidebar",
}

export function ConnectionStatus({
  connectionState,
  variant,
}: {
  connectionState: ConnectionState;
  variant: ConnectionStatusVariant;
}) {
  const { text, isConnected } = useConnectionStatus(connectionState);

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
