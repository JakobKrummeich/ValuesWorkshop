"use client";

import { useState, type ReactNode } from "react";
import { MessageKey } from "../../domain/i18n/messages";
import type { ParticipantSessionStatePort } from "../../domain/ports/participant/sessionStatePort";
import {
  ConnectionStatus,
  ConnectionStatusVariant,
} from "../chrome/ConnectionStatus";
import { PhaseStepper, PhaseStepperVariant } from "../chrome/PhaseStepper";
import { usePhaseStatus } from "../chrome/usePhaseStatus";
import { Wordmark, WordmarkSize } from "../chrome/Wordmark";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useTranslation } from "../i18n/useTranslation";
import { ActionBarSlotProvider } from "./actionBarSlot";
import styles from "./ParticipantShell.module.css";

export function ParticipantShell({
  sessionStatePort,
  children,
}: {
  sessionStatePort: ParticipantSessionStatePort;
  children: ReactNode;
}) {
  const phase = usePhaseStatus(sessionStatePort);
  const { translate } = useTranslation();
  const [actionBarSlot, setActionBarSlot] = useState<HTMLElement | null>(null);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className="visuallyHidden">
          {translate(MessageKey.ParticipantHeading)}
        </h1>
        <div className={styles.brandRow}>
          <Wordmark size={WordmarkSize.Compact} />
          <LanguageSwitcher />
        </div>
        <div className={styles.phaseRow}>
          <PhaseStepper
            currentPhase={phase}
            variant={PhaseStepperVariant.Phone}
          />
          <ConnectionStatus
            sessionStatePort={sessionStatePort}
            variant={ConnectionStatusVariant.Phone}
          />
        </div>
      </header>
      <main className={styles.content}>
        <ActionBarSlotProvider slot={actionBarSlot}>
          {children}
        </ActionBarSlotProvider>
      </main>
      <div className={styles.footer} ref={setActionBarSlot} />
    </div>
  );
}
