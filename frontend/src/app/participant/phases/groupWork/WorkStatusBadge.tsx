"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { GroupWorkStatus } from "../../../../domain/workshopState";
import { CheckMark } from "../../../CheckMark";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./WorkStatusBadge.module.css";

export function WorkStatusBadge({
  workStatus,
}: {
  workStatus: GroupWorkStatus;
}) {
  const { translate } = useTranslation();
  const isSubmitted = workStatus === GroupWorkStatus.Submitted;

  return (
    <span
      className={`${styles.pill} ${
        isSubmitted ? styles.submitted : styles.editing
      }`}
      data-testid="group-work-status"
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
