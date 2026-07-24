import type { Observable } from "rxjs";

export type Completable = Observable<never>;

export type Single<T> = Observable<T>;

export type Maybe<T> = Observable<T>;
