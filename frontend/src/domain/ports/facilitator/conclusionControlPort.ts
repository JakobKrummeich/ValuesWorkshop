import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface FacilitatorConclusionControlPort {
  revealNextValue(): Single<IntentResult>;
}
