"use client";

import type { MessageKey } from "../domain/i18n/messages";
import { focusOnMount } from "./focusOnMount";
import { useTranslation } from "./i18n/useTranslation";
import styles from "./SubmittedConfirmation.module.css";

export function SubmittedConfirmation({
  heading,
  body,
  testId,
}: {
  heading: MessageKey;
  body: MessageKey;
  testId: string;
}) {
  const { translate } = useTranslation();

  return (
    <div
      className={styles.confirmation}
      role="status"
      data-testid={testId}
      tabIndex={-1}
      ref={focusOnMount}
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
      <h2 className={styles.heading}>{translate(heading)}</h2>
      <p className={styles.body}>{translate(body)}</p>
    </div>
  );
}
