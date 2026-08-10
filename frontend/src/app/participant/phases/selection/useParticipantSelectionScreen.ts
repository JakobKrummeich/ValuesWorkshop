"use client";

import { useCallback, useState } from "react";
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
}

export function useParticipantSelectionScreen(
  selection: OwnSelectionView,
): ParticipantSelectionScreenModel {
  const { selection: selectionPort } = useParticipantDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const [chosenValueIds, setChosenValueIds] = useState<readonly string[]>(
    selection.ownSelectedValueIds,
  );
  const [isConfirming, setConfirming] = useState(false);

  const selectedValueIds = selection.isSubmitted
    ? selection.ownSelectedValueIds
    : chosenValueIds;
  const isLocked = selection.isSubmitted || isSending;
  const isFull = selectedValueIds.length >= requiredSelectionCount;
  const canSubmit =
    !isLocked && selectedValueIds.length === requiredSelectionCount;

  const toggleValue = useCallback((valueId: string) => {
    setChosenValueIds((current) =>
      current.includes(valueId)
        ? current.filter((chosenId) => chosenId !== valueId)
        : current.length < requiredSelectionCount
          ? [...current, valueId]
          : current,
    );
  }, []);

  const requestSubmission = useCallback(() => {
    if (canSubmit) {
      setConfirming(true);
    }
  }, [canSubmit]);

  const cancelSubmission = useCallback(() => setConfirming(false), []);

  const confirmSubmission = useCallback(() => {
    setConfirming(false);
    sendIntent(selectionPort.submitSelection(selectedValueIds));
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
  };
}
