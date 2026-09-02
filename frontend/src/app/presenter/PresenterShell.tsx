"use client";

import type { ReactNode } from "react";
import type { PresenterSessionStatePort } from "../../domain/ports/presenter/sessionStatePort";
import {
  ConnectionStatus,
  ConnectionStatusVariant,
} from "../chrome/ConnectionStatus";
import { PhaseStepper, PhaseStepperVariant } from "../chrome/PhaseStepper";
import { useSessionStatus } from "../chrome/useSessionStatus";
import { Wordmark, WordmarkSize } from "../chrome/Wordmark";
import styles from "./PresenterShell.module.css";

export function PresenterShell({
  sessionStatePort,
  children,
}: {
  sessionStatePort: PresenterSessionStatePort;
  children: ReactNode;
}) {
  const { phase, connectionState } = useSessionStatus(sessionStatePort);

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Wordmark size={WordmarkSize.Compact} />
        <PhaseStepper currentPhase={phase} variant={PhaseStepperVariant.Wall} />
      </header>
      <main className={styles.content}>{children}</main>
      <ConnectionStatus
        connectionState={connectionState}
        variant={ConnectionStatusVariant.Wall}
      />
    </div>
  );
}
