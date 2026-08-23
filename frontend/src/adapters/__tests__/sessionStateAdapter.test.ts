import { NEVER, Observable, Subject, of } from "rxjs";
import { TestScheduler } from "rxjs/testing";
import { ConnectionState } from "../../domain/connectionState";
import {
  participantWorkshopStateSchema,
  type ParticipantWorkshopState,
} from "../../domain/workshopState";
import { createSessionStatePort } from "../sessionStateAdapter";
import type { WebsocketConnection } from "../websocketConnection";

function participantStatePayload(
  revision: number,
  ownDisplayName = "Anna Schmidt",
): unknown {
  return {
    revision,
    phase: 1,
    participantCount: 2,
    ownDisplayName,
  };
}

function connectionEmitting(
  states: Observable<unknown>,
  connectionState: Observable<ConnectionState> = NEVER,
): WebsocketConnection {
  return {
    connectionState,
    start: NEVER,
    stop: NEVER,
    on: (methodName: string) =>
      methodName === "ReceiveWorkshopState" ? states : NEVER,
    invoke: () => NEVER,
  };
}

function testScheduler(): TestScheduler {
  return new TestScheduler((actual, expected) =>
    expect(actual).toEqual(expected),
  );
}

describe("session state port", () => {
  it("emits every parsed state in arrival order", () => {
    testScheduler().run(({ cold, expectObservable }) => {
      const payloads = cold("-a-b-|", {
        a: participantStatePayload(1),
        b: participantStatePayload(2),
      });
      const port = createSessionStatePort(
        connectionEmitting(payloads),
        participantWorkshopStateSchema,
      );

      expectObservable(port.workshopState).toBe("-a-b-|", {
        a: expect.objectContaining({ revision: 1 }),
        b: expect.objectContaining({ revision: 2 }),
      });
    });
  });

  it("drops a state that is not newer than the applied one", () => {
    testScheduler().run(({ cold, expectObservable }) => {
      const payloads = cold("-a-b-c-d-|", {
        a: participantStatePayload(1),
        b: participantStatePayload(3),
        c: participantStatePayload(2),
        d: participantStatePayload(3),
      });
      const port = createSessionStatePort(
        connectionEmitting(payloads),
        participantWorkshopStateSchema,
      );

      expectObservable(port.workshopState).toBe("-a-b-----|", {
        a: expect.objectContaining({ revision: 1 }),
        b: expect.objectContaining({ revision: 3 }),
      });
    });
  });

  it("applies a state that repeats the applied revision with different content", () => {
    testScheduler().run(({ cold, expectObservable }) => {
      const payloads = cold("-a-b-c-|", {
        a: participantStatePayload(4, "Anna Schmidt"),
        b: participantStatePayload(4, "Anna Schmidt-Meyer"),
        c: participantStatePayload(4, "Anna Meyer"),
      });
      const port = createSessionStatePort(
        connectionEmitting(payloads),
        participantWorkshopStateSchema,
      );

      expectObservable(port.workshopState).toBe("-a-b-c-|", {
        a: expect.objectContaining({ ownDisplayName: "Anna Schmidt" }),
        b: expect.objectContaining({ ownDisplayName: "Anna Schmidt-Meyer" }),
        c: expect.objectContaining({ ownDisplayName: "Anna Meyer" }),
      });
    });
  });

  it("drops an unparsable state and keeps the stream alive", () => {
    const logged = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    testScheduler().run(({ cold, expectObservable }) => {
      const payloads = cold("-a-b-|", {
        a: { revision: 1, phase: 42 },
        b: participantStatePayload(2),
      });
      const port = createSessionStatePort(
        connectionEmitting(payloads),
        participantWorkshopStateSchema,
      );

      expectObservable(port.workshopState).toBe("---b-|", {
        b: expect.objectContaining({ revision: 2 }),
      });
    });

    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it("replays the latest state to a screen that subscribes later", () => {
    const payloads = new Subject<unknown>();
    const port = createSessionStatePort(
      connectionEmitting(payloads),
      participantWorkshopStateSchema,
    );
    port.workshopState.subscribe();

    payloads.next(participantStatePayload(7));
    const replayed: ParticipantWorkshopState[] = [];
    port.workshopState.subscribe((state) => replayed.push(state));

    expect(replayed.map((state) => state.revision)).toEqual([7]);
  });

  it("passes the connection state through untouched", () => {
    const port = createSessionStatePort(
      connectionEmitting(NEVER, of(ConnectionState.Reconnecting)),
      participantWorkshopStateSchema,
    );

    const states: ConnectionState[] = [];
    port.connectionState.subscribe((state) => states.push(state));

    expect(states).toEqual([ConnectionState.Reconnecting]);
  });
});
