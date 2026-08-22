"use client";

import { MessageKey } from "../domain/i18n/messages";
import { useTranslation } from "./i18n/useTranslation";
import styles from "./WaitingScreen.module.css";

export function WaitingScreen() {
  const { translate } = useTranslation();

  return (
    <section
      className={styles.screen}
      data-testid="waiting-screen"
      aria-label={translate(MessageKey.WaitingWatchWall)}
    >
      <div className={styles.pulse}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M12 17v3" />
          <path d="M8 21h8" />
        </svg>
      </div>
    </section>
  );
}
