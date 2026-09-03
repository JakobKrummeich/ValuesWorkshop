"use client";

import type { MessageKey } from "../domain/i18n/messages";
import { CheckMark } from "./CheckMark";
import { focusOnMount } from "./focusOnMount";
import { useTranslation } from "./i18n/useTranslation";
import { ScreenCopy } from "./ScreenCopy";
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
        <CheckMark className={styles.icon} />
      </span>
      <ScreenCopy heading={translate(heading)} body={translate(body)} />
    </div>
  );
}
