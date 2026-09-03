"use client";

import type { ReactNode } from "react";
import { MessageKey } from "../../domain/i18n/messages";
import type { ParticipantSessionStatePort } from "../../domain/ports/participant/sessionStatePort";
import {
  ConnectionStatus,
  ConnectionStatusVariant,
} from "../chrome/ConnectionStatus";
import { PhaseStepper, PhaseStepperVariant } from "../chrome/PhaseStepper";
import { usePhaseStatus } from "../chrome/usePhaseStatus";
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
  const phase = usePhaseStatus(sessionStatePort);
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
            sessionStatePort={sessionStatePort}
            variant={ConnectionStatusVariant.Phone}
          />
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
