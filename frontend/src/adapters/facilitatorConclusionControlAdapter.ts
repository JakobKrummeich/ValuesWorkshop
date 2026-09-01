import type { FacilitatorConclusionControlPort } from "../domain/ports/facilitator/conclusionControlPort";
import { FacilitatorIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorConclusionControlPort(
  connection: WebsocketConnection,
): FacilitatorConclusionControlPort {
  return {
    revealNextValue: () =>
      invokeIntent(connection, FacilitatorIntent.RevealNextValue),
  };
}
