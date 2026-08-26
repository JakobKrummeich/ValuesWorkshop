"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { GroupWorkStatus } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./GroupWorkCard.module.css";

export function WorkStatusBadge({
  workStatus,
}: {
  workStatus: GroupWorkStatus;
}) {
  const { translate } = useTranslation();

  return (
    <span
      className={`${styles.statusBadge} ${
        workStatus === GroupWorkStatus.Submitted
          ? styles.statusSubmitted
          : styles.statusEditing
      }`}
      data-testid="group-work-status"
    >
      {workStatus === GroupWorkStatus.Submitted
        ? translate(MessageKey.GroupWorkStatusSubmitted)
        : translate(MessageKey.GroupWorkStatusEditing)}
    </span>
  );
}
