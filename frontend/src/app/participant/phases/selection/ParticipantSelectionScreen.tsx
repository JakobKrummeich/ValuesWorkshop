"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantSelectionState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { SubmittedConfirmation } from "../../../SubmittedConfirmation";
import { ActionBar } from "../../ActionBar";
import { CallToAction } from "../../CallToAction";
import styles from "./ParticipantSelectionScreen.module.css";
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
    remainingCount,
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
      <SubmittedConfirmation
        heading={MessageKey.SelectionSubmittedHeading}
        body={MessageKey.SelectionSubmittedBody}
        testId="selection-submitted-confirmation"
      />
    );
  }

  return (
    <section className={styles.selection}>
      <header className={styles.header}>
        <h2 className={styles.prompt}>
          {translate(MessageKey.SelectionChoosePrompt)}
        </h2>
        <p className={styles.badge} data-testid="selected-count">
          {translate(MessageKey.SelectionSelectedCount, {
            selected: selectedCount,
            total: requiredSelectionCount,
          })}
        </p>
      </header>
      <SelectionChipGrid chips={chips} onToggle={toggleValue} />
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
      <ActionBar
        hint={
          remainingCount > 0
            ? translate(MessageKey.SelectionPickMore, { count: remainingCount })
            : undefined
        }
        hintTestId="selection-hint"
      >
        <CallToAction
          testId="submit-selection-button"
          buttonRef={submitButtonRef}
          disabled={!canSubmit}
          onClick={requestSubmission}
        >
          {translate(MessageKey.SelectionSubmit)}
        </CallToAction>
      </ActionBar>
      {isConfirming && (
        <SelectionConfirmDialog
          onCancel={cancelSubmission}
          onConfirm={confirmSubmission}
        />
      )}
    </section>
  );
}
