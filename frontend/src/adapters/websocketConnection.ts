import type { Observable } from "rxjs";
import type { ConnectionState } from "../domain/connectionState";
import type { Completable, Single } from "../shared/reactiveTypes";

export interface WebsocketConnection {
  readonly connectionState: Observable<ConnectionState>;
  start(): Completable;
  stop(): Completable;
  on(methodName: string): Observable<unknown>;
  invoke(methodName: string, ...payload: unknown[]): Single<unknown>;
}

export interface WebsocketConnectionOptions {
  url: string;
  accessToken?: Single<string>;
}
