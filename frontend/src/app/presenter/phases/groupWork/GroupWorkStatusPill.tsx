"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { GroupWorkStatus } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./GroupWorkStatusPill.module.css";

export function GroupWorkStatusPill({
  animalId,
  workStatus,
}: {
  animalId: string;
  workStatus: GroupWorkStatus;
}) {
  const { translate } = useTranslation();
  const isSubmitted = workStatus === GroupWorkStatus.Submitted;

  return (
    <span
      className={`${styles.pill} ${
        isSubmitted ? styles.submitted : styles.editing
      }`}
      data-testid={`presenter-group-status-${animalId}`}
    >
      {isSubmitted && (
        <svg
          className={styles.check}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
      )}
      {translate(
        isSubmitted
          ? MessageKey.GroupWorkStatusSubmitted
          : MessageKey.GroupWorkStatusEditing,
      )}
    </span>
  );
}
