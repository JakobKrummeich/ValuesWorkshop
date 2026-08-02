import { catchError, defer, from, map, of, switchMap } from "rxjs";
import type { Single } from "../shared/reactiveTypes";

export interface JsonResponse {
  readonly status: number;
  readonly body: unknown;
}

export function postJson(
  url: string,
  body: unknown,
  bearerToken: string,
): Single<JsonResponse> {
  return defer(() =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(body),
    }),
  ).pipe(switchMap(jsonResponseOf));
}

function jsonResponseOf(response: Response): Single<JsonResponse> {
  return from(response.json()).pipe(
    catchError(() => of(undefined)),
    map((body: unknown) => ({ status: response.status, body })),
  );
}
