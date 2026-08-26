import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface FacilitatorWalkControlPort {
  goToNextValue(): Single<IntentResult>;
  correctActionWording(actionId: string, text: string): Single<IntentResult>;
}
