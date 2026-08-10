import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface ParticipantQuizPort {
  chooseAnswer(
    questionIndex: number,
    answerIndex: number,
  ): Single<IntentResult>;
}
