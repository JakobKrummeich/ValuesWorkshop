"use client";

import { MessageKey } from "../../domain/i18n/messages";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useTranslation } from "../i18n/useTranslation";
import { PhaseView } from "../PhaseView";
import { SessionStatusBanner } from "../SessionStatusBanner";
import { usePresenterDependencies } from "./dependencies";
import { presenterPhaseView } from "./phases/phaseView";
import styles from "./page.module.css";

export default function PresenterHome() {
  const { sessionState } = usePresenterDependencies();
  const { translate } = useTranslation();

  return (
    <main className={styles.page}>
      <LanguageSwitcher />
      <h1 className={styles.heading}>
        {translate(MessageKey.PresenterHeading)}
      </h1>
      <SessionStatusBanner sessionState={sessionState} />
      <PhaseView sessionState={sessionState} components={presenterPhaseView} />
    </main>
  );
}
