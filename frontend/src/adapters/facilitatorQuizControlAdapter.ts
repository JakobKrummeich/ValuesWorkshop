import type { FacilitatorQuizControlPort } from "../domain/ports/facilitator/quizControlPort";
import { FacilitatorIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorQuizControlPort(
  connection: WebsocketConnection,
): FacilitatorQuizControlPort {
  return {
    revealAnswer: () =>
      invokeIntent(connection, FacilitatorIntent.RevealAnswer),
    showLearningText: () =>
      invokeIntent(connection, FacilitatorIntent.ShowLearningText),
    poseNextQuestion: () =>
      invokeIntent(connection, FacilitatorIntent.PoseNextQuestion),
  };
}
