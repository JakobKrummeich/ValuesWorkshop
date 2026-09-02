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
      <span className={styles.disc}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 12.5 4 4 8-9" />
        </svg>
      </span>
      <h2 className={styles.heading}>{translate(heading)}</h2>
      <p className={styles.body}>{translate(body)}</p>
    </div>
  );
}
