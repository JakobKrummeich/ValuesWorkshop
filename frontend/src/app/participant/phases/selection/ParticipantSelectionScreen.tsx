"use client";

import { useRef, type KeyboardEvent } from "react";
import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantSelectionState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./ParticipantSelectionScreen.module.css";
import {
  requiredSelectionCount,
  useParticipantSelectionScreen,
} from "./useParticipantSelectionScreen";

function focusOnMount(button: HTMLButtonElement | null) {
  button?.focus();
}

function cycleTabFocus(event: KeyboardEvent<HTMLDivElement>) {
  const buttons = event.currentTarget.querySelectorAll("button");
  const first = buttons[0];
  const last = buttons[buttons.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function ParticipantSelectionScreen({
  state,
}: {
  state: ParticipantSelectionState;
}) {
  const { language, translate } = useTranslation();
  const {
    chips,
    selectedCount,
    isSubmitted,
    canSubmit,
    isConfirming,
    toggleValue,
    requestSubmission,
    cancelSubmission,
    confirmSubmission,
    rejectionMessage,
  } = useParticipantSelectionScreen(state.selection);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  const cancelAndRefocus = () => {
    cancelSubmission();
    submitButtonRef.current?.focus();
  };

  const confirmAndRefocus = () => {
    confirmSubmission();
    submitButtonRef.current?.focus();
  };

  return (
    <section className={styles.selection}>
      <h2 className={styles.prompt}>
        {translate(MessageKey.SelectionChoosePrompt)}
      </h2>
      <p className={styles.counter} data-testid="selected-count">
        {translate(MessageKey.SelectionSelectedCount, {
          selected: selectedCount,
          total: requiredSelectionCount,
        })}
      </p>
      <div className={styles.grid}>
        {chips.map((chip) => (
          <button
            key={chip.valueId}
            type="button"
            className={
              chip.isSelected
                ? `${styles.chip} ${styles.selected}`
                : styles.chip
            }
            data-testid={`value-chip-${chip.valueId}`}
            aria-pressed={chip.isSelected}
            disabled={chip.isDisabled}
            onClick={() => toggleValue(chip.valueId)}
          >
            {localizedText(language, chip.text)}
          </button>
        ))}
      </div>
      {isSubmitted ? (
        <p
          className={styles.submittedNotice}
          role="status"
          data-testid="submitted-notice"
        >
          {translate(MessageKey.SelectionSubmittedNotice)}
        </p>
      ) : (
        <button
          type="button"
          className={styles.submitButton}
          data-testid="submit-selection-button"
          ref={submitButtonRef}
          disabled={!canSubmit}
          onClick={requestSubmission}
        >
          {translate(MessageKey.SelectionSubmit)}
        </button>
      )}
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
      {isConfirming && (
        <div className={styles.dialogBackdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="selection-confirm-title"
            className={styles.dialog}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                cancelAndRefocus();
              } else if (event.key === "Tab") {
                cycleTabFocus(event);
              }
            }}
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
                onClick={cancelAndRefocus}
              >
                {translate(MessageKey.SelectionConfirmCancel)}
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                data-testid="confirm-submit-button"
                onClick={confirmAndRefocus}
              >
                {translate(MessageKey.SelectionConfirmSubmit)}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
