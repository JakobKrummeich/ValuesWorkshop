"use client";

import type { PresentedAction } from "../../../../domain/workshopState";
import styles from "./PresentedActionEditor.module.css";
import { usePresentedActionEditor } from "./usePresentedActionEditor";

export function PresentedActionEditor({
  action,
  onCorrect,
}: {
  action: PresentedAction;
  onCorrect: (actionId: string, text: string) => void;
}) {
  const { draft, editDraft, handleBlur, handleKeyDown } =
    usePresentedActionEditor(action, onCorrect);

  return (
    <input
      type="text"
      className={styles.input}
      data-testid={`presented-action-input-${action.actionId}`}
      value={draft}
      onChange={(event) => editDraft(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
