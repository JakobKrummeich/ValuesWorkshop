import type { ParticipantQuizPort } from "../domain/ports/participant/quizPort";
import { ParticipantIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createParticipantQuizPort(
  connection: WebsocketConnection,
): ParticipantQuizPort {
  return {
    chooseAnswer: (questionIndex, answerIndex) =>
      invokeIntent(
        connection,
        ParticipantIntent.ChooseQuizAnswer,
        questionIndex,
        answerIndex,
      ),
  };
}
