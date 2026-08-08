"use client";

import { MessageKey } from "../../domain/i18n/messages";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useTranslation } from "../i18n/useTranslation";
import { PhaseView } from "../PhaseView";
import { SessionStatusBanner } from "../SessionStatusBanner";
import { useParticipantDependencies } from "./dependencies";
import { participantPhaseView } from "./phases/phaseView";
import styles from "./page.module.css";

export default function ParticipantHome() {
  const { sessionStatePort } = useParticipantDependencies();
  const { translate } = useTranslation();

  return (
    <main className={styles.page}>
      <LanguageSwitcher />
      <h1 className={styles.heading}>
        {translate(MessageKey.ParticipantHeading)}
      </h1>
      <SessionStatusBanner sessionStatePort={sessionStatePort} />
      <PhaseView
        sessionStatePort={sessionStatePort}
        components={participantPhaseView}
      />
    </main>
  );
}
