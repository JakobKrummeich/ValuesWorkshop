import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface FacilitatorQuizControlPort {
  revealAnswer(): Single<IntentResult>;
  showLearningText(): Single<IntentResult>;
  poseNextQuestion(): Single<IntentResult>;
}
