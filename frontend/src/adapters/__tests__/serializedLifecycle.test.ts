import { EMPTY, Observable, Subject, defer, throwError } from "rxjs";
import type { Completable } from "../../shared/reactiveTypes";
import { withSerializedLifecycle } from "../serializedLifecycle";
import type { WebsocketConnection } from "../websocketConnection";

interface FakeWebsocketConnection {
  connection: WebsocketConnection;
  startCount: () => number;
  stopCount: () => number;
}

function createFakeConnection(
  startOperations: Completable[],
  onStop: () => void = () => undefined,
): FakeWebsocketConnection {
  let startCount = 0;
  let stopCount = 0;

  const connection: WebsocketConnection = {
    connectionState: EMPTY,
    start: () =>
      defer(() => startOperations[startCount++] ?? EMPTY) as Completable,
    stop: () =>
      defer(() => {
        stopCount++;
        onStop();
        return EMPTY;
      }) as Completable,
    on: () => EMPTY,
    invoke: () => EMPTY,
  };

  return {
    connection,
    startCount: () => startCount,
    stopCount: () => stopCount,
  };
}

describe("serialized connection lifecycle", () => {
  it("runs a stop after a pending start instead of overlapping them", async () => {
    const calls: string[] = [];
    const pendingStart = new Subject<never>();
    const fake = createFakeConnection(
      [
        new Observable<never>((subscriber) => {
          pendingStart.subscribe(subscriber);
        }),
      ],
      () => calls.push("stop"),
    );
    const connection = withSerializedLifecycle(fake.connection);

    connection.start().subscribe();
    const stopped = new Promise<void>((resolve) =>
      connection.stop().subscribe({ complete: () => resolve() }),
    );
    expect(calls).toEqual([]);
    calls.push("start");
    pendingStart.complete();
    await stopped;

    expect(calls).toEqual(["start", "stop"]);
  });

  it("starts again once a start aborted by a stop has settled", async () => {
    const fake = createFakeConnection([
      throwError(() => new Error("The connection was stopped")),
    ]);
    const connection = withSerializedLifecycle(fake.connection);

    connection.start().subscribe({ error: () => undefined });
    connection.stop().subscribe();
    await new Promise<void>((resolve) =>
      connection.start().subscribe({ complete: () => resolve() }),
    );

    expect(fake.startCount()).toBe(2);
    expect(fake.stopCount()).toBe(1);
  });
});
