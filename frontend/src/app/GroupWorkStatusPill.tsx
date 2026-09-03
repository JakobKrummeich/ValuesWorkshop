"use client";

import { MessageKey } from "../domain/i18n/messages";
import { GroupWorkStatus } from "../domain/workshopState";
import { CheckMark } from "./CheckMark";
import styles from "./GroupWorkStatusPill.module.css";
import { useTranslation } from "./i18n/useTranslation";

export function GroupWorkStatusPill({
  workStatus,
  testId,
}: {
  workStatus: GroupWorkStatus;
  testId: string;
}) {
  const { translate } = useTranslation();
  const isSubmitted = workStatus === GroupWorkStatus.Submitted;

  return (
    <span
      className={`${styles.pill} ${
        isSubmitted ? styles.submitted : styles.editing
      }`}
      data-testid={testId}
    >
      {isSubmitted && <CheckMark />}
      {translate(
        isSubmitted
          ? MessageKey.GroupWorkStatusSubmitted
          : MessageKey.GroupWorkStatusEditing,
      )}
    </span>
  );
}
