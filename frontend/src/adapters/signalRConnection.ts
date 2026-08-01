import { HubConnectionBuilder, type HubConnection } from "@microsoft/signalr";
import {
  BehaviorSubject,
  Observable,
  defer,
  firstValueFrom,
  ignoreElements,
  tap,
} from "rxjs";
import { ConnectionState } from "../domain/connectionState";
import { reconnectDelayMilliseconds } from "./reconnectBackoff";
import type {
  WebsocketConnection,
  WebsocketConnectionOptions,
} from "./websocketConnection";

export function buildHubConnection(
  options: WebsocketConnectionOptions,
): HubConnection {
  const accessToken = options.accessToken;

  return new HubConnectionBuilder()
    .withUrl(options.url, {
      accessTokenFactory: accessToken && (() => firstValueFrom(accessToken)),
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (context) =>
        reconnectDelayMilliseconds(context.previousRetryCount),
    })
    .build();
}

export function wrapHubConnection(
  hubConnection: HubConnection,
): WebsocketConnection {
  const state = new BehaviorSubject<ConnectionState>(
    ConnectionState.Disconnected,
  );

  hubConnection.onreconnecting(() => state.next(ConnectionState.Reconnecting));
  hubConnection.onreconnected(() => state.next(ConnectionState.Connected));
  hubConnection.onclose(() => state.next(ConnectionState.Disconnected));

  return {
    connectionState: state.asObservable(),

    start: defer(() => {
      state.next(ConnectionState.Connecting);
      return hubConnection.start();
    }).pipe(
      tap({
        next: () => state.next(ConnectionState.Connected),
        error: () => state.next(ConnectionState.Disconnected),
      }),
      ignoreElements(),
    ),

    stop: defer(() => hubConnection.stop()).pipe(ignoreElements()),

    on: (methodName: string) =>
      new Observable<unknown>((subscriber) => {
        const handler = (payload: unknown) => subscriber.next(payload);
        hubConnection.on(methodName, handler);
        return () => hubConnection.off(methodName, handler);
      }),

    invoke: (methodName: string, ...payload: unknown[]) =>
      defer(() => hubConnection.invoke(methodName, ...payload)),
  };
}

export function createSignalRConnection(
  options: WebsocketConnectionOptions,
): WebsocketConnection {
  return wrapHubConnection(buildHubConnection(options));
}
