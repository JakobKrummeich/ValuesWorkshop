import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface FacilitatorVotingControlPort {
  closeVoting(): Single<IntentResult>;
  startTiebreakRound(): Single<IntentResult>;
}
