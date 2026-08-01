"use client";

import { SessionStatusBanner } from "../SessionStatusBanner";
import { useParticipantDependencies } from "./dependencies";
import styles from "./page.module.css";

export default function ParticipantHome() {
  const { sessionState } = useParticipantDependencies();

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Participant</h1>
      <SessionStatusBanner sessionState={sessionState} />
    </main>
  );
}
