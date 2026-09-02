"use client";

import type { ReactNode } from "react";
import type { FacilitatorSessionStatePort } from "../../domain/ports/facilitator/sessionStatePort";
import {
  ConnectionStatus,
  ConnectionStatusVariant,
} from "../chrome/ConnectionStatus";
import { PhaseStepper, PhaseStepperVariant } from "../chrome/PhaseStepper";
import { Wordmark, WordmarkSize } from "../chrome/Wordmark";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { AdvancePhaseButton } from "./AdvancePhaseButton";
import styles from "./FacilitatorShell.module.css";
import { useFacilitatorShell } from "./useFacilitatorShell";

export function FacilitatorShell({
  sessionStatePort,
  children,
}: {
  sessionStatePort: FacilitatorSessionStatePort;
  children: ReactNode;
}) {
  const {
    phase,
    connectionState,
    heading,
    title,
    participantsLabel,
    participantCount,
  } = useFacilitatorShell(sessionStatePort);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Wordmark size={WordmarkSize.Regular} />
        <h2 className="visuallyHidden">{heading}</h2>
        <PhaseStepper
          currentPhase={phase}
          variant={PhaseStepperVariant.Sidebar}
        />
        <dl className={styles.meta}>
          <dt className={styles.eyebrow}>{participantsLabel}</dt>
          <dd className={styles.numeral}>{participantCount}</dd>
        </dl>
        <div className={styles.tools}>
          <ConnectionStatus
            connectionState={connectionState}
            variant={ConnectionStatusVariant.Sidebar}
          />
          <LanguageSwitcher />
        </div>
      </aside>
      <main className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </main>
      <footer className={styles.bottomBar}>
        <AdvancePhaseButton />
      </footer>
    </div>
  );
}
