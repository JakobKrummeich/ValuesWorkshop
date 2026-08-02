import { catchError, defaultIfEmpty, map, of, switchMap } from "rxjs";
import { z } from "zod";
import { hubBaseUrl } from "../config/environment";
import type { FacilitatorSessionCreationPort } from "../domain/ports/facilitator/sessionCreationPort";
import {
  SessionCreationFailure,
  sessionCreated,
  sessionCreationRejected,
  type SessionCreationOutcome,
} from "../domain/sessionCreation";
import type { Single } from "../shared/reactiveTypes";
import { getAccessToken } from "./authAdapter";
import { postJson, type JsonResponse } from "./http";

const sessionCreationResponseSchema = z.object({
  sessionIdentity: z.uuid(),
});

const failureByStatus: Record<number, SessionCreationFailure> = {
  400: SessionCreationFailure.SessionNameRejected,
  401: SessionCreationFailure.PassphraseRejected,
};

export const facilitatorSessionCreation: FacilitatorSessionCreationPort = {
  openSession,
};

function openSession(
  sessionName: string,
  passphrase: string,
): Single<SessionCreationOutcome> {
  return getAccessToken().pipe(
    switchMap((accessToken) =>
      postSession(accessToken, sessionName, passphrase),
    ),
    defaultIfEmpty(
      sessionCreationRejected(SessionCreationFailure.NotAuthenticated),
    ),
  );
}

function postSession(
  accessToken: string,
  sessionName: string,
  passphrase: string,
): Single<SessionCreationOutcome> {
  return postJson(
    `${hubBaseUrl()}/api/sessions`,
    { sessionName, passphrase },
    accessToken,
  ).pipe(
    map(outcomeOf),
    catchError(() =>
      of(sessionCreationRejected(SessionCreationFailure.Unexpected)),
    ),
  );
}

function outcomeOf(response: JsonResponse): SessionCreationOutcome {
  if (response.status === 201) {
    return sessionCreated(
      sessionCreationResponseSchema.parse(response.body).sessionIdentity,
    );
  }

  return sessionCreationRejected(
    failureByStatus[response.status] ?? SessionCreationFailure.Unexpected,
  );
}
