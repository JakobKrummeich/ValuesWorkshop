"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { OwnSelectionView } from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useParticipantDependencies } from "../../dependencies";

export const requiredSelectionCount = 10;

export interface SelectionChip {
  valueId: string;
  text: LocalizedText;
  isSelected: boolean;
  isDisabled: boolean;
}

export interface ParticipantSelectionScreenModel {
  chips: SelectionChip[];
  selectedCount: number;
  isSubmitted: boolean;
  canSubmit: boolean;
  isConfirming: boolean;
  toggleValue: (valueId: string) => void;
  requestSubmission: () => void;
  cancelSubmission: () => void;
  confirmSubmission: () => void;
  rejectionMessage: MessageKey | null;
  submitButtonRef: RefObject<HTMLButtonElement | null>;
}

export function useParticipantSelectionScreen(
  selection: OwnSelectionView,
): ParticipantSelectionScreenModel {
  const { selectionPort } = useParticipantDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const [chosenValueIds, setChosenValueIds] = useState<readonly string[]>(
    selection.ownSelectedValueIds,
  );
  const [isConfirming, setConfirming] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedValueIds = selection.isSubmitted
    ? selection.ownSelectedValueIds
    : chosenValueIds;
  const isLocked = selection.isSubmitted || isSending;
  const isFull = selectedValueIds.length >= requiredSelectionCount;
  const canSubmit =
    !isLocked && selectedValueIds.length === requiredSelectionCount;

  const toggleValue = useCallback((valueId: string) => {
    setChosenValueIds((current) => {
      if (current.includes(valueId)) {
        return current.filter((chosenId) => chosenId !== valueId);
      }
      if (current.length >= requiredSelectionCount) {
        return current;
      }
      return [...current, valueId];
    });
  }, []);

  const requestSubmission = useCallback(() => {
    if (canSubmit) {
      setConfirming(true);
    }
  }, [canSubmit]);

  const cancelSubmission = useCallback(() => {
    setConfirming(false);
    submitButtonRef.current?.focus();
  }, []);

  const confirmSubmission = useCallback(() => {
    setConfirming(false);
    sendIntent(selectionPort.submitSelection(selectedValueIds));
    submitButtonRef.current?.focus();
  }, [selectionPort, selectedValueIds, sendIntent]);

  return {
    chips: selection.values.map(({ valueId, text }) => {
      const isSelected = selectedValueIds.includes(valueId);
      return {
        valueId,
        text,
        isSelected,
        isDisabled: isLocked || (isFull && !isSelected),
      };
    }),
    selectedCount: selectedValueIds.length,
    isSubmitted: selection.isSubmitted,
    canSubmit,
    isConfirming,
    toggleValue,
    requestSubmission,
    cancelSubmission,
    confirmSubmission,
    rejectionMessage,
    submitButtonRef,
  };
}
