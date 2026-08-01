import { EMPTY, ReplaySubject, catchError, concat, defer } from "rxjs";
import type { Completable } from "../shared/reactiveTypes";
import type { WebsocketConnection } from "./websocketConnection";

export function withSerializedLifecycle(
  connection: WebsocketConnection,
): WebsocketConnection {
  const queue = createLifecycleQueue();

  return {
    ...connection,
    start: queue(connection.start),
    stop: queue(connection.stop),
  };
}

function createLifecycleQueue(): (operation: Completable) => Completable {
  let pending: Completable = EMPTY;

  return (operation: Completable) =>
    defer(() => {
      const settled = new ReplaySubject<never>();
      const queued = concat(pending, operation);

      pending = settled.pipe(catchError(() => EMPTY));
      queued.subscribe(settled);

      return settled;
    });
}
