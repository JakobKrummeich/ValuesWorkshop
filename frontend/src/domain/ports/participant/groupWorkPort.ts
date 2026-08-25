import type { IntentResult } from "../../intentResult";
import type { Single } from "../../../shared/reactiveTypes";

export interface ParticipantGroupWorkPort {
  addAction(valueId: string): Single<IntentResult>;
  editAction(actionId: string, text: string): Single<IntentResult>;
  removeAction(actionId: string): Single<IntentResult>;
  submitGroupWork(
    values: ReadonlyArray<{
      valueId: string;
      actions: ReadonlyArray<{ actionId: string; text: string }>;
    }>,
  ): Single<IntentResult>;
  reopenGroupWork(): Single<IntentResult>;
}
