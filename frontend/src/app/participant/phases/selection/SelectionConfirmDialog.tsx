"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { focusOnMount } from "../../../focusOnMount";
import { useTranslation } from "../../../i18n/useTranslation";
import { CallToAction, CallToActionVariant } from "../../CallToAction";
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
    <div className={styles.backdrop}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="selection-confirm-title"
        className={styles.sheet}
        onKeyDown={trapKeyboardFocus}
      >
        <span className={styles.handle} aria-hidden="true" />
        <h3 id="selection-confirm-title" className={styles.title}>
          {translate(MessageKey.SelectionConfirmTitle)}
        </h3>
        <p className={styles.body}>
          {translate(MessageKey.SelectionConfirmBody)}
        </p>
        <div className={styles.actions}>
          <CallToAction
            variant={CallToActionVariant.Ghost}
            testId="confirm-cancel-button"
            buttonRef={focusOnMount}
            onClick={onCancel}
          >
            {translate(MessageKey.SelectionConfirmCancel)}
          </CallToAction>
          <CallToAction testId="confirm-submit-button" onClick={onConfirm}>
            {translate(MessageKey.SelectionConfirmSubmit)}
          </CallToAction>
        </div>
      </div>
    </div>
  );
}
