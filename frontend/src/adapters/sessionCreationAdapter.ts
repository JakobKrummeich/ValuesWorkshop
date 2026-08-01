import { defaultIfEmpty, defer, switchMap } from "rxjs";
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
  return defer(() =>
    fetch(`${hubBaseUrl()}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ sessionName, passphrase }),
    })
      .then(outcomeOf)
      .catch(() => sessionCreationRejected(SessionCreationFailure.Unexpected)),
  );
}

function outcomeOf(response: Response): Promise<SessionCreationOutcome> {
  if (response.status === 201) {
    return response
      .json()
      .then((body: unknown) =>
        sessionCreated(
          sessionCreationResponseSchema.parse(body).sessionIdentity,
        ),
      );
  }

  return Promise.resolve(
    sessionCreationRejected(
      failureByStatus[response.status] ?? SessionCreationFailure.Unexpected,
    ),
  );
}
