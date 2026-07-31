import { map } from "rxjs";
import { intentResultSchema } from "../domain/intentResult";
import type { FacilitatorLifecyclePort } from "../domain/ports/facilitator/lifecyclePort";
import type { SignalRConnection } from "./signalRConnection";

export function createFacilitatorLifecyclePort(
  connection: SignalRConnection,
): FacilitatorLifecyclePort {
  return {
    advancePhase: () =>
      connection
        .invoke("AdvancePhase")
        .pipe(map((result) => intentResultSchema.parse(result))),
  };
}
