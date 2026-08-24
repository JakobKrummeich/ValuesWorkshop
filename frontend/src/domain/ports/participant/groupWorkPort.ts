import type { IntentResult } from "../../intentResult";
import type { Single } from "../../../shared/reactiveTypes";

export interface ParticipantGroupWorkPort {
  addAction(
    actionId: string,
    valueId: string,
    text: string,
  ): Single<IntentResult>;
  editAction(actionId: string, text: string): Single<IntentResult>;
  removeAction(actionId: string): Single<IntentResult>;
  submitGroupWork(): Single<IntentResult>;
  reopenGroupWork(): Single<IntentResult>;
}
