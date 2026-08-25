"use client";

import { useCallback, useEffect, useState } from "react";
import {
  asyncScheduler,
  catchError,
  concatMap,
  EMPTY,
  filter,
  groupBy,
  mergeMap,
  Subject,
  takeUntil,
  throttleTime,
} from "rxjs";
import type { IntentResult } from "../../../../domain/intentResult";
import type { Single } from "../../../../shared/reactiveTypes";

export const editThrottleIntervalMilliseconds = 300;

interface ActionEdit {
  actionId: string;
  text: string;
}

export interface ThrottledActionEdits {
  queueEdit: (actionId: string, text: string) => void;
  cancelEditsFor: (actionId: string) => void;
}

export function useThrottledActionEdits(
  sendEdit: (actionId: string, text: string) => Single<IntentResult>,
): ThrottledActionEdits {
  const [edits] = useState(() => new Subject<ActionEdit>());
  const [removals] = useState(() => new Subject<string>());

  useEffect(() => {
    const removalOf = (actionId: string) =>
      removals.pipe(filter((removedActionId) => removedActionId === actionId));
    const subscription = edits
      .pipe(
        groupBy((edit) => edit.actionId, {
          duration: (editsForAction) => removalOf(editsForAction.key),
        }),
        mergeMap((editsForAction) =>
          editsForAction.pipe(
            throttleTime(editThrottleIntervalMilliseconds, asyncScheduler, {
              leading: true,
              trailing: true,
            }),
            takeUntil(removalOf(editsForAction.key)),
            concatMap((edit) =>
              sendEdit(edit.actionId, edit.text).pipe(catchError(() => EMPTY)),
            ),
          ),
        ),
      )
      .subscribe();
    return () => subscription.unsubscribe();
  }, [edits, removals, sendEdit]);

  const queueEdit = useCallback(
    (actionId: string, text: string) => edits.next({ actionId, text }),
    [edits],
  );

  const cancelEditsFor = useCallback(
    (actionId: string) => removals.next(actionId),
    [removals],
  );

  return { queueEdit, cancelEditsFor };
}
