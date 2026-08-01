"use client";

import { SessionStatusBanner } from "../SessionStatusBanner";
import { usePresenterDependencies } from "./dependencies";
import styles from "./page.module.css";

export default function PresenterHome() {
  const { sessionState } = usePresenterDependencies();

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Presenter</h1>
      <SessionStatusBanner sessionState={sessionState} />
    </main>
  );
}
