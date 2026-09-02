"use client";

import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { PhaseView } from "../PhaseView";
import { SessionStatusBanner } from "../SessionStatusBanner";
import { usePresenterDependencies } from "./dependencies";
import { presenterPhaseView } from "./phases/phaseView";
import styles from "./page.module.css";

export default function PresenterHome() {
  const { sessionStatePort } = usePresenterDependencies();

  return (
    <main className={styles.page}>
      <header className={styles.chrome}>
        <LanguageSwitcher />
        <SessionStatusBanner sessionStatePort={sessionStatePort} />
      </header>
      <PhaseView
        sessionStatePort={sessionStatePort}
        components={presenterPhaseView}
      />
    </main>
  );
}
