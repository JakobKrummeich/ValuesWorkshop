import type { HubConnection } from "@microsoft/signalr";
import { of } from "rxjs";
import { ConnectionState } from "../../domain/connectionState";
import {
  buildHubConnection,
  createSignalRConnection,
  wrapHubConnection,
} from "../signalRConnection";

interface FakeHubConnection {
  hubConnection: HubConnection;
  start: jest.Mock;
  stop: jest.Mock;
  invoke: jest.Mock;
  on: jest.Mock;
  off: jest.Mock;
  raiseReconnecting: () => void;
  raiseReconnected: () => void;
  raiseClose: () => void;
  handlerFor: (methodName: string) => (payload: unknown) => void;
}

function createFakeHubConnection(): FakeHubConnection {
  const handlers = new Map<string, (payload: unknown) => void>();
  const lifecycle = new Map<string, () => void>();

  const fake = {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    invoke: jest.fn(() => Promise.resolve({ isAccepted: true })),
    on: jest.fn((methodName: string, handler: (payload: unknown) => void) =>
      handlers.set(methodName, handler),
    ),
    off: jest.fn((methodName: string) => handlers.delete(methodName)),
    onreconnecting: jest.fn((callback: () => void) =>
      lifecycle.set("reconnecting", callback),
    ),
    onreconnected: jest.fn((callback: () => void) =>
      lifecycle.set("reconnected", callback),
    ),
    onclose: jest.fn((callback: () => void) =>
      lifecycle.set("close", callback),
    ),
  };

  return {
    hubConnection: fake as unknown as HubConnection,
    start: fake.start,
    stop: fake.stop,
    invoke: fake.invoke,
    on: fake.on,
    off: fake.off,
    raiseReconnecting: () => lifecycle.get("reconnecting")?.(),
    raiseReconnected: () => lifecycle.get("reconnected")?.(),
    raiseClose: () => lifecycle.get("close")?.(),
    handlerFor: (methodName: string) => handlers.get(methodName)!,
  };
}

function collectStates(states: ConnectionState[]) {
  return (state: ConnectionState) => states.push(state);
}

describe("signalR connection wrapper", () => {
  it("starts disconnected and replays the latest state to late subscribers", () => {
    const fake = createFakeHubConnection();
    const connection = wrapHubConnection(fake.hubConnection);

    const states: ConnectionState[] = [];
    connection.connectionState.subscribe(collectStates(states));

    expect(states).toEqual([ConnectionState.Disconnected]);
  });

  it("does not touch the hub until the start observable is subscribed", () => {
    const fake = createFakeHubConnection();
    const connection = wrapHubConnection(fake.hubConnection);

    connection.start();

    expect(fake.start).not.toHaveBeenCalled();
  });

  it("reports connecting then connected while starting", async () => {
    const fake = createFakeHubConnection();
    const connection = wrapHubConnection(fake.hubConnection);
    const states: ConnectionState[] = [];
    connection.connectionState.subscribe(collectStates(states));

    await new Promise<void>((resolve) =>
      connection.start().subscribe({ complete: resolve }),
    );

    expect(states).toEqual([
      ConnectionState.Disconnected,
      ConnectionState.Connecting,
      ConnectionState.Connected,
    ]);
  });

  it("reports disconnected and surfaces the error when starting fails", async () => {
    const fake = createFakeHubConnection();
    fake.start.mockReturnValue(Promise.reject(new Error("handshake refused")));
    const connection = wrapHubConnection(fake.hubConnection);
    const states: ConnectionState[] = [];
    connection.connectionState.subscribe(collectStates(states));

    const error = await new Promise<Error>((resolve) =>
      connection.start().subscribe({ error: resolve }),
    );

    expect(error.message).toBe("handshake refused");
    expect(states).toEqual([
      ConnectionState.Disconnected,
      ConnectionState.Connecting,
      ConnectionState.Disconnected,
    ]);
  });

  it("maps the hub reconnect lifecycle onto the state stream", () => {
    const fake = createFakeHubConnection();
    const connection = wrapHubConnection(fake.hubConnection);
    const states: ConnectionState[] = [];
    connection.connectionState.subscribe(collectStates(states));

    fake.raiseReconnecting();
    fake.raiseReconnected();
    fake.raiseClose();

    expect(states).toEqual([
      ConnectionState.Disconnected,
      ConnectionState.Reconnecting,
      ConnectionState.Connected,
      ConnectionState.Disconnected,
    ]);
  });

  it("emits every payload the hub pushes to a subscribed method", () => {
    const fake = createFakeHubConnection();
    const connection = wrapHubConnection(fake.hubConnection);
    const payloads: unknown[] = [];

    const subscription = connection
      .on("ReceiveWorkshopState")
      .subscribe((payload) => payloads.push(payload));
    fake.handlerFor("ReceiveWorkshopState")({ revision: 1 });
    fake.handlerFor("ReceiveWorkshopState")({ revision: 2 });
    subscription.unsubscribe();

    expect(payloads).toEqual([{ revision: 1 }, { revision: 2 }]);
    expect(fake.off).toHaveBeenCalledWith(
      "ReceiveWorkshopState",
      expect.any(Function),
    );
  });

  it("invokes a hub method lazily and emits its single result", async () => {
    const fake = createFakeHubConnection();
    const connection = wrapHubConnection(fake.hubConnection);

    const invocation = connection.invoke("AdvancePhase", { reason: "next" });
    expect(fake.invoke).not.toHaveBeenCalled();

    const result = await new Promise<unknown>((resolve) =>
      invocation.subscribe(resolve),
    );

    expect(result).toEqual({ isAccepted: true });
    expect(fake.invoke).toHaveBeenCalledWith("AdvancePhase", {
      reason: "next",
    });
  });

  it("stops the hub connection on subscribe", async () => {
    const fake = createFakeHubConnection();
    const connection = wrapHubConnection(fake.hubConnection);

    await new Promise<void>((resolve) =>
      connection.stop().subscribe({ complete: resolve }),
    );

    expect(fake.stop).toHaveBeenCalled();
  });
});

describe("hub connection construction", () => {
  it("binds the connection to the given hub url", () => {
    const hubConnection = buildHubConnection({
      url: "http://localhost:5000/hub/participant?sessionIdentity=abc",
      accessToken: of("token"),
    });

    expect(hubConnection.baseUrl).toBe(
      "http://localhost:5000/hub/participant?sessionIdentity=abc",
    );
  });

  it("creates a wrapped connection that is not started yet", () => {
    const connection = createSignalRConnection({
      url: "http://localhost:5000/hub/presenter",
    });

    const states: ConnectionState[] = [];
    connection.connectionState.subscribe(collectStates(states));

    expect(states).toEqual([ConnectionState.Disconnected]);
  });
});
