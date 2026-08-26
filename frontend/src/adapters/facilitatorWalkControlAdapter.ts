import type { FacilitatorWalkControlPort } from "../domain/ports/facilitator/walkControlPort";
import { FacilitatorIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorWalkControlPort(
  connection: WebsocketConnection,
): FacilitatorWalkControlPort {
  return {
    goToNextValue: () =>
      invokeIntent(connection, FacilitatorIntent.GoToNextValue),
    correctActionWording: (actionId, text) =>
      invokeIntent(
        connection,
        FacilitatorIntent.CorrectActionWording,
        actionId,
        text,
      ),
  };
}
