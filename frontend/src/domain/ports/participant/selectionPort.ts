import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface ParticipantSelectionPort {
  submitSelection(valueIds: readonly string[]): Single<IntentResult>;
}
