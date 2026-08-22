"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./SelectionSubmittedConfirmation.module.css";

export function SelectionSubmittedConfirmation() {
  const { translate } = useTranslation();

  return (
    <div
      className={styles.confirmation}
      role="status"
      data-testid="selection-submitted-confirmation"
    >
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
        <circle cx="12" cy="12" r="10" />
        <path d="m8.5 12.5 2.5 2.5 5-6" />
      </svg>
      <h2 className={styles.heading}>
        {translate(MessageKey.SelectionSubmittedHeading)}
      </h2>
      <p className={styles.body}>
        {translate(MessageKey.SelectionSubmittedBody)}
      </p>
    </div>
  );
}
