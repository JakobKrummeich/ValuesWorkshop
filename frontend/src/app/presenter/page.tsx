"use client";

import { PhaseView } from "../PhaseView";
import { SessionStatusBanner } from "../SessionStatusBanner";
import { usePresenterDependencies } from "./dependencies";
import { presenterPhaseView } from "./phases/phaseView";
import styles from "./page.module.css";

export default function PresenterHome() {
  const { sessionStatePort } = usePresenterDependencies();

  return (
    <main className={styles.page}>
      <SessionStatusBanner sessionStatePort={sessionStatePort} />
      <PhaseView
        sessionStatePort={sessionStatePort}
        components={presenterPhaseView}
      />
    </main>
  );
}
