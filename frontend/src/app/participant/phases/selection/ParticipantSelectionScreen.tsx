"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantSelectionState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./ParticipantSelectionScreen.module.css";
import { SubmittedConfirmation } from "../../../SubmittedConfirmation";
import { SelectionChipGrid } from "./SelectionChipGrid";
import { SelectionConfirmDialog } from "./SelectionConfirmDialog";
import {
  requiredSelectionCount,
  useParticipantSelectionScreen,
} from "./useParticipantSelectionScreen";

export function ParticipantSelectionScreen({
  state,
}: {
  state: ParticipantSelectionState;
}) {
  const { translate } = useTranslation();
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
    submitButtonRef,
  } = useParticipantSelectionScreen(state.selection);

  if (isSubmitted) {
    return (
      <section className={styles.selection}>
        <SubmittedConfirmation
          heading={MessageKey.SelectionSubmittedHeading}
          body={MessageKey.SelectionSubmittedBody}
          testId="selection-submitted-confirmation"
        />
      </section>
    );
  }

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
      <SelectionChipGrid chips={chips} onToggle={toggleValue} />
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
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
      {isConfirming && (
        <SelectionConfirmDialog
          onCancel={cancelSubmission}
          onConfirm={confirmSubmission}
        />
      )}
    </section>
  );
}
