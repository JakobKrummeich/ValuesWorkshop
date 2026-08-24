"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./GroupWorkCard.module.css";

export function GroupWorkControls({
  isSubmitted,
  canSubmit,
  isSending,
  onSubmit,
  onReopen,
}: {
  isSubmitted: boolean;
  canSubmit: boolean;
  isSending: boolean;
  onSubmit: () => void;
  onReopen: () => void;
}) {
  const { translate } = useTranslation();

  if (isSubmitted) {
    return (
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.reopenButton}
          data-testid="reopen-button"
          onClick={onReopen}
          disabled={isSending}
        >
          {translate(MessageKey.GroupWorkReopen)}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.submitButton}
        data-testid="submit-group-work-button"
        disabled={!canSubmit || isSending}
        onClick={onSubmit}
      >
        {translate(MessageKey.GroupWorkSubmit)}
      </button>
      {!canSubmit && (
        <p className={styles.disabledHint} data-testid="submit-disabled-hint">
          {translate(MessageKey.GroupWorkSubmitDisabledHint)}
        </p>
      )}
    </div>
  );
}
