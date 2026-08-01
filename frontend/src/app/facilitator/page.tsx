"use client";

import { SessionStatusBanner } from "../SessionStatusBanner";
import { AdvancePhaseButton } from "./AdvancePhaseButton";
import { useFacilitatorDependencies } from "./dependencies";
import styles from "./page.module.css";

export default function FacilitatorHome() {
  const { sessionState } = useFacilitatorDependencies();

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Facilitator</h1>
      <SessionStatusBanner sessionState={sessionState} />
      <AdvancePhaseButton />
    </main>
  );
}
