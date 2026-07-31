import {
  EMPTY,
  distinctUntilChanged,
  filter,
  mergeMap,
  of,
  scan,
  shareReplay,
} from "rxjs";
import type { ZodType } from "zod";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { WebsocketConnection } from "./websocketConnection";

const RECEIVE_WORKSHOP_STATE = "ReceiveWorkshopState";

interface RevisionedState {
  revision: number;
}

export function createSessionStatePort<TState extends RevisionedState>(
  connection: WebsocketConnection,
  schema: ZodType<TState>,
): SessionStatePort<TState> {
  const workshopState = connection.on(RECEIVE_WORKSHOP_STATE).pipe(
    mergeMap((payload) => {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        console.error("Dropped an unparsable workshop state", parsed.error);
        return EMPTY;
      }
      return of(parsed.data);
    }),
    scan<TState, TState | null>(
      (applied, incoming) =>
        applied !== null && incoming.revision <= applied.revision
          ? applied
          : incoming,
      null,
    ),
    distinctUntilChanged(),
    filter((state): state is TState => state !== null),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  return { workshopState, connectionState: connection.connectionState };
}
