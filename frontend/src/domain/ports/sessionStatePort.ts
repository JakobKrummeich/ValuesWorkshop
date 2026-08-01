import type { Observable } from "rxjs";
import type { ConnectionState } from "../connectionState";

export interface SessionStatePort<TState> {
  readonly workshopState: Observable<TState>;
  readonly connectionState: Observable<ConnectionState>;
}
