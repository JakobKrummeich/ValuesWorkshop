import type { ParticipantGroupWorkPort } from "../domain/ports/participant/groupWorkPort";
import { ParticipantIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createParticipantGroupWorkPort(
  connection: WebsocketConnection,
): ParticipantGroupWorkPort {
  return {
    addAction: (valueId) =>
      invokeIntent(connection, ParticipantIntent.AddAction, valueId),
    editAction: (actionId, text) =>
      invokeIntent(connection, ParticipantIntent.EditAction, actionId, text),
    removeAction: (actionId) =>
      invokeIntent(connection, ParticipantIntent.RemoveAction, actionId),
    submitGroupWork: (values) =>
      invokeIntent(connection, ParticipantIntent.SubmitGroupWork, values),
    reopenGroupWork: () =>
      invokeIntent(connection, ParticipantIntent.ReopenGroupWork),
  };
}
