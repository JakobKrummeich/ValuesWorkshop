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
  stop: () => void;
}

export function createThrottledActionEdits(
  sendEdit: (actionId: string, text: string) => Single<IntentResult>,
): ThrottledActionEdits {
  const edits = new Subject<ActionEdit>();
  const removals = new Subject<string>();

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

  return {
    queueEdit: (actionId, text) => edits.next({ actionId, text }),
    cancelEditsFor: (actionId) => removals.next(actionId),
    stop: () => {
      subscription.unsubscribe();
      edits.complete();
      removals.complete();
    },
  };
}
