"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import type { PresentedAction } from "../../../../domain/workshopState";

export interface PresentedActionEditorModel {
  draft: string;
  editDraft: (text: string) => void;
  handleBlur: () => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function usePresentedActionEditor(
  action: PresentedAction,
  onCorrect: (actionId: string, text: string) => void,
): PresentedActionEditorModel {
  const [draft, setDraft] = useState(action.text);

  const commit = useCallback(() => {
    const corrected = draft.trim();

    if (corrected.length === 0) {
      setDraft(action.text);
      return;
    }

    if (corrected !== action.text) {
      onCorrect(action.actionId, corrected);
    }
  }, [draft, action, onCorrect]);

  const handleBlur = useCallback(() => {
    commit();
  }, [commit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        commit();
      }

      if (event.key === "Escape") {
        setDraft(action.text);
      }
    },
    [commit, action],
  );

  return { draft, editDraft: setDraft, handleBlur, handleKeyDown };
}
