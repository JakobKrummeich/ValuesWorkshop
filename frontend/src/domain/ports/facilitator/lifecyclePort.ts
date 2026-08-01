import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface FacilitatorLifecyclePort {
  advancePhase(): Single<IntentResult>;
}
