"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Subscription } from "rxjs";
import { navigateTo, sessionUrl } from "../../adapters/browserLocation";
import type { FacilitatorSessionCreationPort } from "../../domain/ports/facilitator/sessionCreationPort";
import {
  SessionCreationFailure,
  type SessionCreationOutcome,
} from "../../domain/sessionCreation";

const FACILITATOR_PATH = "/facilitator";
const BLANK_SESSION_NAME_MESSAGE = "Enter a session name.";

const messageByFailure: Record<SessionCreationFailure, string> = {
  [SessionCreationFailure.PassphraseRejected]:
    "That facilitator passphrase was not accepted.",
  [SessionCreationFailure.SessionNameRejected]:
    "That session name was not accepted. Use up to 120 characters.",
  [SessionCreationFailure.Unexpected]:
    "The session could not be opened. Please try again.",
};

export interface OpenSessionFormResult {
  sessionName: string;
  passphrase: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  changeSessionName: (event: ChangeEvent<HTMLInputElement>) => void;
  changePassphrase: (event: ChangeEvent<HTMLInputElement>) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useOpenSessionForm(
  sessionCreation: FacilitatorSessionCreationPort,
): OpenSessionFormResult {
  const [sessionName, setSessionName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const inFlightCreation = useRef<Subscription | null>(null);

  useEffect(
    () => () => {
      inFlightCreation.current?.unsubscribe();
    },
    [],
  );

  const changeSessionName = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setSessionName(event.target.value),
    [],
  );

  const changePassphrase = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPassphrase(event.target.value),
    [],
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const requestedName = sessionName.trim();
      if (requestedName === "") {
        setErrorMessage(BLANK_SESSION_NAME_MESSAGE);
        return;
      }

      setErrorMessage(null);
      setSubmitting(true);
      inFlightCreation.current?.unsubscribe();

      let isLeaving = false;
      inFlightCreation.current = sessionCreation
        .openSession(requestedName, passphrase)
        .subscribe({
          next(outcome: SessionCreationOutcome) {
            if (!outcome.isCreated) {
              setErrorMessage(messageByFailure[outcome.failure]);
              return;
            }

            isLeaving = true;
            navigateTo(sessionUrl(FACILITATOR_PATH, outcome.sessionIdentity));
          },
          error() {
            setErrorMessage(
              messageByFailure[SessionCreationFailure.Unexpected],
            );
            setPassphrase("");
            setSubmitting(false);
          },
          complete() {
            setPassphrase("");
            if (!isLeaving) {
              setSubmitting(false);
            }
          },
        });
    },
    [sessionCreation, sessionName, passphrase],
  );

  return {
    sessionName,
    passphrase,
    errorMessage,
    isSubmitting,
    changeSessionName,
    changePassphrase,
    submit,
  };
}
