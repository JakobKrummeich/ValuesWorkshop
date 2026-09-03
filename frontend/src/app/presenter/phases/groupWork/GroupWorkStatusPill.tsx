"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { GroupWorkStatus } from "../../../../domain/workshopState";
import { CheckMark } from "../../../CheckMark";
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
      {isSubmitted && <CheckMark />}
      {translate(
        isSubmitted
          ? MessageKey.GroupWorkStatusSubmitted
          : MessageKey.GroupWorkStatusEditing,
      )}
    </span>
  );
}
