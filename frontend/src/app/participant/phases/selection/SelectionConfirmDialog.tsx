"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { focusOnMount } from "../../../focusOnMount";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./SelectionConfirmDialog.module.css";
import { useSelectionConfirmDialog } from "./useSelectionConfirmDialog";

export function SelectionConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { translate } = useTranslation();
  const { trapKeyboardFocus } = useSelectionConfirmDialog(onCancel);

  return (
    <div className={styles.dialogBackdrop}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="selection-confirm-title"
        className={styles.dialog}
        onKeyDown={trapKeyboardFocus}
      >
        <h3 id="selection-confirm-title" className={styles.dialogTitle}>
          {translate(MessageKey.SelectionConfirmTitle)}
        </h3>
        <p className={styles.dialogBody}>
          {translate(MessageKey.SelectionConfirmBody)}
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.cancelButton}
            data-testid="confirm-cancel-button"
            ref={focusOnMount}
            onClick={onCancel}
          >
            {translate(MessageKey.SelectionConfirmCancel)}
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            data-testid="confirm-submit-button"
            onClick={onConfirm}
          >
            {translate(MessageKey.SelectionConfirmSubmit)}
          </button>
        </div>
      </div>
    </div>
  );
}
