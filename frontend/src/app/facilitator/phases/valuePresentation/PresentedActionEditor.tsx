"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresentedAction } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresentedActionEditor.module.css";
import { usePresentedActionEditor } from "./usePresentedActionEditor";

export function PresentedActionEditor({
  action,
  onCorrect,
}: {
  action: PresentedAction;
  onCorrect: (actionId: string, text: string) => void;
}) {
  const { translate } = useTranslation();
  const { draft, editDraft, handleBlur, handleKeyDown } =
    usePresentedActionEditor(action, onCorrect);

  return (
    <span className={styles.editor}>
      <input
        type="text"
        className={styles.input}
        data-testid={`presented-action-input-${action.actionId}`}
        aria-label={translate(MessageKey.ValuePresentationActionWording)}
        value={draft}
        onChange={(event) => editDraft(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <span className={styles.pencil} aria-hidden="true">
        ✎
      </span>
    </span>
  );
}
