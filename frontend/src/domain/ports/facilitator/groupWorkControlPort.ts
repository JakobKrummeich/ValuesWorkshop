import type { IntentResult } from "../../intentResult";
import type { Single } from "../../../shared/reactiveTypes";

export interface FacilitatorGroupWorkControlPort {
  reassignScribe(participantId: string): Single<IntentResult>;
}
