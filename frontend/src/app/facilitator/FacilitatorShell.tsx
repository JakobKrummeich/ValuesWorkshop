"use client";

import type { ReactNode } from "react";
import type { FacilitatorSessionStatePort } from "../../domain/ports/facilitator/sessionStatePort";
import {
  ConnectionStatus,
  ConnectionStatusVariant,
} from "../chrome/ConnectionStatus";
import { PhaseStepper, PhaseStepperVariant } from "../chrome/PhaseStepper";
import { Wordmark, WordmarkSize } from "../chrome/Wordmark";
import { Eyebrow, EyebrowTone } from "../Eyebrow";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { AdvanceGuard } from "./AdvanceGuard";
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
    heading,
    title,
    sessionCodeLabel,
    sessionCode,
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
          {sessionCode !== null && (
            <div className={styles.metaEntry}>
              <dt>
                <Eyebrow tone={EyebrowTone.Muted}>{sessionCodeLabel}</Eyebrow>
              </dt>
              <dd className={styles.sessionCode}>{sessionCode}</dd>
            </div>
          )}
          <div className={styles.metaEntry}>
            <dt>
              <Eyebrow tone={EyebrowTone.Muted}>{participantsLabel}</Eyebrow>
            </dt>
            <dd className={styles.numeral}>{participantCount}</dd>
          </div>
        </dl>
        <div className={styles.tools}>
          <ConnectionStatus
            sessionStatePort={sessionStatePort}
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
        <AdvanceGuard />
        <AdvancePhaseButton />
      </footer>
    </div>
  );
}
