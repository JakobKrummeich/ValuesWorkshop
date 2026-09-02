"use client";

import type { ReactNode } from "react";
import { MessageKey } from "../../domain/i18n/messages";
import type { ParticipantSessionStatePort } from "../../domain/ports/participant/sessionStatePort";
import {
  ConnectionStatus,
  ConnectionStatusVariant,
} from "../chrome/ConnectionStatus";
import { PhaseStepper, PhaseStepperVariant } from "../chrome/PhaseStepper";
import { useSessionStatus } from "../chrome/useSessionStatus";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useTranslation } from "../i18n/useTranslation";
import styles from "./ParticipantShell.module.css";

export function ParticipantShell({
  sessionStatePort,
  children,
}: {
  sessionStatePort: ParticipantSessionStatePort;
  children: ReactNode;
}) {
  const { phase, connectionState } = useSessionStatus(sessionStatePort);
  const { translate } = useTranslation();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className="visuallyHidden">
          {translate(MessageKey.ParticipantHeading)}
        </h1>
        <PhaseStepper
          currentPhase={phase}
          variant={PhaseStepperVariant.Phone}
        />
        <div className={styles.tools}>
          <LanguageSwitcher />
          <ConnectionStatus
            connectionState={connectionState}
            variant={ConnectionStatusVariant.Phone}
          />
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
