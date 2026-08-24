import type { FacilitatorGroupWorkControlPort } from "../domain/ports/facilitator/groupWorkControlPort";
import { FacilitatorIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorGroupWorkControlPort(
  connection: WebsocketConnection,
): FacilitatorGroupWorkControlPort {
  return {
    reassignScribe: (groupName, participantId) =>
      invokeIntent(
        connection,
        FacilitatorIntent.ReassignScribe,
        groupName,
        participantId,
      ),
  };
}
