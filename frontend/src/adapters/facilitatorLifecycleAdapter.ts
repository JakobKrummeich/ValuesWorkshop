import { map } from "rxjs";
import { intentResultSchema } from "../domain/intentResult";
import type { FacilitatorLifecyclePort } from "../domain/ports/facilitator/lifecyclePort";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorLifecyclePort(
  connection: WebsocketConnection,
): FacilitatorLifecyclePort {
  return {
    advancePhase: () =>
      connection
        .invoke("AdvancePhase")
        .pipe(map((result) => intentResultSchema.parse(result))),
  };
}
