"use client";

import { MessageKey } from "../../domain/i18n/messages";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useTranslation } from "../i18n/useTranslation";
import { PhaseView } from "../PhaseView";
import { SessionStatusBanner } from "../SessionStatusBanner";
import { AdvancePhaseButton } from "./AdvancePhaseButton";
import { useFacilitatorDependencies } from "./dependencies";
import { facilitatorPhaseView } from "./phases/phaseView";
import styles from "./page.module.css";

export default function FacilitatorHome() {
  const { sessionState } = useFacilitatorDependencies();
  const { translate } = useTranslation();

  return (
    <main className={styles.page}>
      <LanguageSwitcher />
      <h1 className={styles.heading}>
        {translate(MessageKey.FacilitatorHeading)}
      </h1>
      <SessionStatusBanner sessionState={sessionState} />
      <PhaseView
        sessionState={sessionState}
        components={facilitatorPhaseView}
      />
      <AdvancePhaseButton />
    </main>
  );
}
