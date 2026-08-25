"use client";

import { useCallback, useMemo, useState } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import {
  GroupWorkStatus,
  type GroupActionView,
  type OwnGroupView,
  type WorkshopValue,
} from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useParticipantDependencies } from "../../dependencies";
import {
  actionsForValue,
  everyValueHasNonEmptyAction,
  valueSubmissions,
} from "./actionDrafts";
import { useThrottledActionEdits } from "./useThrottledActionEdits";

export interface GroupWorkCardModel {
  groupName: OwnGroupView["name"];
  memberDisplayNames: string[];
  scribeName: string | null;
  isCallerScribe: boolean;
  isSubmitted: boolean;
  assignedValues: WorkshopValue[];
  selectedValueId: string | null;
  selectValue: (valueId: string) => void;
  actionsForSelectedValue: GroupActionView[];
  localTexts: Record<string, string>;
  addAction: () => void;
  editActionText: (actionId: string, text: string) => void;
  removeAction: (actionId: string) => void;
  submitGroupWork: () => void;
  reopenGroupWork: () => void;
  canSubmit: boolean;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
}

export function useGroupWorkCard(ownGroup: OwnGroupView): GroupWorkCardModel {
  const { groupWorkPort } = useParticipantDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const [selectedValueId, setSelectedValueId] = useState<string | null>(
    ownGroup.assignedValues.length > 0
      ? ownGroup.assignedValues[0].valueId
      : null,
  );
  const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
  const sendEdit = useCallback(
    (actionId: string, text: string) =>
      groupWorkPort.editAction(actionId, text),
    [groupWorkPort],
  );
  const { queueEdit, cancelEditsFor } = useThrottledActionEdits(sendEdit);

  const isCallerScribe = ownGroup.isCallerScribe === true;
  const isSubmitted = ownGroup.workStatus === GroupWorkStatus.Submitted;
  const actions = useMemo(() => ownGroup.actions ?? [], [ownGroup.actions]);
  const canSubmit =
    isCallerScribe &&
    !isSubmitted &&
    !isSending &&
    everyValueHasNonEmptyAction(ownGroup.assignedValues, actions, localTexts);

  const editActionText = useCallback(
    (actionId: string, text: string) => {
      setLocalTexts((current) => ({ ...current, [actionId]: text }));
      queueEdit(actionId, text);
    },
    [queueEdit],
  );

  const addAction = useCallback(() => {
    if (!isCallerScribe || isSubmitted || selectedValueId === null) return;
    sendIntent(groupWorkPort.addAction(selectedValueId));
  }, [isCallerScribe, isSubmitted, selectedValueId, sendIntent, groupWorkPort]);

  const removeAction = useCallback(
    (actionId: string) => {
      if (!isCallerScribe || isSubmitted) return;
      cancelEditsFor(actionId);
      setLocalTexts((current) => {
        const next = { ...current };
        delete next[actionId];
        return next;
      });
      sendIntent(groupWorkPort.removeAction(actionId));
    },
    [isCallerScribe, isSubmitted, cancelEditsFor, sendIntent, groupWorkPort],
  );

  const submitGroupWork = useCallback(() => {
    if (!canSubmit) return;
    sendIntent(
      groupWorkPort.submitGroupWork(
        valueSubmissions(ownGroup.assignedValues, actions, localTexts),
      ),
    );
  }, [
    canSubmit,
    sendIntent,
    groupWorkPort,
    ownGroup.assignedValues,
    actions,
    localTexts,
  ]);

  const reopenGroupWork = useCallback(() => {
    if (!isCallerScribe || !isSubmitted) return;
    sendIntent(groupWorkPort.reopenGroupWork());
  }, [isCallerScribe, isSubmitted, sendIntent, groupWorkPort]);

  return {
    groupName: ownGroup.name,
    memberDisplayNames: ownGroup.memberDisplayNames,
    scribeName: ownGroup.scribeName ?? null,
    isCallerScribe,
    isSubmitted,
    assignedValues: ownGroup.assignedValues,
    selectedValueId,
    selectValue: setSelectedValueId,
    actionsForSelectedValue: actionsForValue(actions, selectedValueId),
    localTexts,
    addAction,
    editActionText,
    removeAction,
    submitGroupWork,
    reopenGroupWork,
    canSubmit,
    isSending,
    rejectionMessage,
  };
}
