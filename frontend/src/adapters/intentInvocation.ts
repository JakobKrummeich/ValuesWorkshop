import { map } from "rxjs";
import { intentResultSchema, type IntentResult } from "../domain/intentResult";
import type {
  FacilitatorIntent,
  ParticipantIntent,
} from "../domain/workshopState";
import type { Single } from "../shared/reactiveTypes";
import type { WebsocketConnection } from "./websocketConnection";

export function invokeIntent(
  connection: WebsocketConnection,
  methodName: FacilitatorIntent | ParticipantIntent,
  ...payload: unknown[]
): Single<IntentResult> {
  return connection
    .invoke(methodName, ...payload)
    .pipe(map((result) => intentResultSchema.parse(result)));
}
