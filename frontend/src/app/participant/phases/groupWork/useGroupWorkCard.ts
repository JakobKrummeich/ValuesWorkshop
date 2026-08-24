"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import type { MessageKey } from "../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../domain/intentResult";
import {
  GroupWorkStatus,
  type GroupActionView,
  type OwnGroupView,
  type WorkshopValue,
} from "../../../../domain/workshopState";
import type { Single } from "../../../../shared/reactiveTypes";
import { useParticipantDependencies } from "../../dependencies";

const throttleIntervalMilliseconds = 300;

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

function actionsForValue(
  actions: GroupActionView[],
  valueId: string | null,
): GroupActionView[] {
  if (valueId === null) return [];
  return actions
    .filter((action) => action.valueId === valueId)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

function resolveActionText(
  action: GroupActionView,
  localTexts: Record<string, string>,
): string {
  const local = localTexts[action.actionId];
  return local !== undefined ? local : action.text;
}

function everyValueHasNonEmptyAction(
  assignedValues: WorkshopValue[],
  actions: GroupActionView[],
  localTexts: Record<string, string>,
): boolean {
  return assignedValues.every((value) =>
    actions
      .filter((action) => action.valueId === value.valueId)
      .some(
        (action) => resolveActionText(action, localTexts).trim().length > 0,
      ),
  );
}

export function useGroupWorkCard(ownGroup: OwnGroupView): GroupWorkCardModel {
  const { groupWorkPort } = useParticipantDependencies();
  const [selectedValueId, setSelectedValueId] = useState<string | null>(
    ownGroup.assignedValues.length > 0
      ? ownGroup.assignedValues[0].valueId
      : null,
  );
  const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<MessageKey | null>(
    null,
  );
  const intentSubscription = useRef<Subscription | null>(null);
  const throttleTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const pendingTexts = useRef<Record<string, string>>({});

  useEffect(
    () => () => {
      intentSubscription.current?.unsubscribe();
      for (const timer of Object.values(throttleTimers.current)) {
        clearTimeout(timer);
      }
    },
    [],
  );

  const isCallerScribe = ownGroup.isCallerScribe === true;
  const isSubmitted = ownGroup.workStatus === GroupWorkStatus.Submitted;
  const actions = ownGroup.actions ?? [];
  const canSubmit =
    isCallerScribe &&
    !isSubmitted &&
    !isSending &&
    everyValueHasNonEmptyAction(ownGroup.assignedValues, actions, localTexts);

  const sendIntent = useCallback((intent: Single<IntentResult>) => {
    setIsSending(true);
    intentSubscription.current?.unsubscribe();
    intentSubscription.current = intent.subscribe({
      next(result) {
        setRejectionMessage(result.isAccepted ? null : null);
      },
      error() {
        setIsSending(false);
      },
      complete() {
        setIsSending(false);
      },
    });
  }, []);

  const flushThrottle = useCallback(
    (actionId: string) => {
      const text = pendingTexts.current[actionId];
      if (text !== undefined) {
        delete pendingTexts.current[actionId];
        groupWorkPort.editAction(actionId, text).subscribe();
      }
    },
    [groupWorkPort],
  );

  const editActionText = useCallback(
    (actionId: string, text: string) => {
      setLocalTexts((current) => ({ ...current, [actionId]: text }));
      pendingTexts.current[actionId] = text;

      if (throttleTimers.current[actionId] === undefined) {
        groupWorkPort.editAction(actionId, text).subscribe();
        delete pendingTexts.current[actionId];
        throttleTimers.current[actionId] = setTimeout(() => {
          delete throttleTimers.current[actionId];
          flushThrottle(actionId);
        }, throttleIntervalMilliseconds);
      }
    },
    [groupWorkPort, flushThrottle],
  );

  const addAction = useCallback(() => {
    if (!isCallerScribe || isSubmitted || selectedValueId === null) return;
    const actionId = crypto.randomUUID();
    sendIntent(groupWorkPort.addAction(actionId, selectedValueId, ""));
  }, [isCallerScribe, isSubmitted, selectedValueId, sendIntent, groupWorkPort]);

  const removeAction = useCallback(
    (actionId: string) => {
      if (!isCallerScribe || isSubmitted) return;
      setLocalTexts((current) => {
        const next = { ...current };
        delete next[actionId];
        return next;
      });
      sendIntent(groupWorkPort.removeAction(actionId));
    },
    [isCallerScribe, isSubmitted, sendIntent, groupWorkPort],
  );

  const submitGroupWork = useCallback(() => {
    if (!canSubmit) return;
    for (const actionId of Object.keys(throttleTimers.current)) {
      clearTimeout(throttleTimers.current[actionId]);
      delete throttleTimers.current[actionId];
      flushThrottle(actionId);
    }
    sendIntent(groupWorkPort.submitGroupWork());
  }, [canSubmit, sendIntent, groupWorkPort, flushThrottle]);

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
