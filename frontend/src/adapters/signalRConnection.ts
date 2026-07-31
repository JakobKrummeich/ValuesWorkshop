import {
  HubConnectionBuilder,
  type HubConnection,
  type IRetryPolicy,
  type RetryContext,
} from "@microsoft/signalr";
import { BehaviorSubject, Observable, defer, ignoreElements } from "rxjs";
import { ConnectionState } from "../domain/connectionState";
import type { Completable, Single } from "../shared/reactiveTypes";

export interface SignalRConnection {
  readonly connectionState: Observable<ConnectionState>;
  start(): Completable;
  stop(): Completable;
  on(methodName: string): Observable<unknown>;
  invoke(methodName: string, ...payload: unknown[]): Single<unknown>;
}

export interface SignalRConnectionOptions {
  url: string;
  accessTokenFactory?: () => Promise<string>;
}

const INITIAL_RETRY_DELAY_MILLISECONDS = 1000;
const MAXIMUM_RETRY_DELAY_MILLISECONDS = 30000;

export function exponentialBackoffRetryPolicy(
  random: () => number = Math.random,
): IRetryPolicy {
  return {
    nextRetryDelayInMilliseconds: (context: RetryContext) => {
      const exponential =
        INITIAL_RETRY_DELAY_MILLISECONDS * 2 ** context.previousRetryCount;
      const capped = Math.min(exponential, MAXIMUM_RETRY_DELAY_MILLISECONDS);
      return Math.round(capped * (0.5 + 0.5 * random()));
    },
  };
}

export function buildHubConnection(
  options: SignalRConnectionOptions,
): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(options.url, { accessTokenFactory: options.accessTokenFactory })
    .withAutomaticReconnect(exponentialBackoffRetryPolicy())
    .build();
}

export function wrapHubConnection(
  hubConnection: HubConnection,
): SignalRConnection {
  const state = new BehaviorSubject<ConnectionState>(
    ConnectionState.Disconnected,
  );

  let lifecycle: Promise<unknown> = Promise.resolve();

  function afterPendingLifecycle(
    operation: () => Promise<void>,
  ): Promise<void> {
    const queued = lifecycle.then(operation, operation);
    lifecycle = queued.catch(() => undefined);
    return queued;
  }

  hubConnection.onreconnecting(() => state.next(ConnectionState.Reconnecting));
  hubConnection.onreconnected(() => state.next(ConnectionState.Connected));
  hubConnection.onclose(() => state.next(ConnectionState.Disconnected));

  return {
    connectionState: state.asObservable(),

    start: () =>
      defer(() =>
        afterPendingLifecycle(() => {
          state.next(ConnectionState.Connecting);
          return hubConnection
            .start()
            .then(() => state.next(ConnectionState.Connected))
            .catch((error: unknown) => {
              state.next(ConnectionState.Disconnected);
              throw error;
            });
        }),
      ).pipe(ignoreElements()),

    stop: () =>
      defer(() => afterPendingLifecycle(() => hubConnection.stop())).pipe(
        ignoreElements(),
      ),

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
  options: SignalRConnectionOptions,
): SignalRConnection {
  return wrapHubConnection(buildHubConnection(options));
}
