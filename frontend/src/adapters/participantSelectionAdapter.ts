import type { ParticipantSelectionPort } from "../domain/ports/participant/selectionPort";
import { ParticipantIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createParticipantSelectionPort(
  connection: WebsocketConnection,
): ParticipantSelectionPort {
  return {
    submitSelection: (valueIds) =>
      invokeIntent(
        connection,
        ParticipantIntent.SubmitValueSelection,
        valueIds,
      ),
  };
}
