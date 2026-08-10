import type { FacilitatorLifecyclePort } from "../domain/ports/facilitator/lifecyclePort";
import { FacilitatorIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorLifecyclePort(
  connection: WebsocketConnection,
): FacilitatorLifecyclePort {
  return {
    advancePhase: () =>
      invokeIntent(connection, FacilitatorIntent.AdvancePhase),
  };
}
