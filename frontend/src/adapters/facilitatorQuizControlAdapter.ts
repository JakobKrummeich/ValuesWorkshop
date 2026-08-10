import type { FacilitatorQuizControlPort } from "../domain/ports/facilitator/quizControlPort";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorQuizControlPort(
  connection: WebsocketConnection,
): FacilitatorQuizControlPort {
  return {
    revealAnswer: () => invokeIntent(connection, "RevealAnswer"),
    showLearningText: () => invokeIntent(connection, "ShowLearningText"),
    poseNextQuestion: () => invokeIntent(connection, "PoseNextQuestion"),
  };
}
