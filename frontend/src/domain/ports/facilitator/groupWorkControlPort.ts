import type { IntentResult } from "../../intentResult";
import type { Single } from "../../../shared/reactiveTypes";

export interface FacilitatorGroupWorkControlPort {
  reassignScribe(
    groupName: string,
    participantId: string,
  ): Single<IntentResult>;
}
