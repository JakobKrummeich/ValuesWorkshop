"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Subscription } from "rxjs";
import { navigateTo, sessionUrl } from "../../adapters/browserLocation";
import { MessageKey } from "../../domain/i18n/messages";
import type { MessageParameters } from "../../domain/i18n/translate";
import type { FacilitatorSessionCreationPort } from "../../domain/ports/facilitator/sessionCreationPort";
import {
  maximumSessionNameLength,
  SessionCreationFailure,
  type SessionCreationOutcome,
} from "../../domain/sessionCreation";

const FACILITATOR_PATH = "/facilitator";

const messageByFailure: Readonly<Record<SessionCreationFailure, MessageKey>> = {
  [SessionCreationFailure.NotAuthenticated]:
    MessageKey.OpenSessionSignInExpired,
  [SessionCreationFailure.PassphraseRejected]:
    MessageKey.OpenSessionPassphraseRejected,
  [SessionCreationFailure.SessionNameRejected]:
    MessageKey.OpenSessionNameRejected,
  [SessionCreationFailure.Unexpected]: MessageKey.OpenSessionUnexpected,
};

export interface FormError {
  key: MessageKey;
  params?: MessageParameters;
}

export interface OpenSessionFormResult {
  sessionName: string;
  passphrase: string;
  error: FormError | null;
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
  const [error, setError] = useState<FormError | null>(null);
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
        setError({ key: MessageKey.OpenSessionNameRequired });
        return;
      }

      setError(null);
      setSubmitting(true);
      inFlightCreation.current?.unsubscribe();

      inFlightCreation.current = sessionCreation
        .openSession(requestedName, passphrase)
        .subscribe({
          next(outcome: SessionCreationOutcome) {
            setPassphrase("");

            if (!outcome.isCreated) {
              setError({
                key: messageByFailure[outcome.failure],
                params: { limit: maximumSessionNameLength },
              });
              setSubmitting(false);
              return;
            }

            navigateTo(sessionUrl(FACILITATOR_PATH, outcome.sessionIdentity));
          },
          error() {
            setError({
              key: messageByFailure[SessionCreationFailure.Unexpected],
            });
            setPassphrase("");
            setSubmitting(false);
          },
        });
    },
    [sessionCreation, sessionName, passphrase],
  );

  return {
    sessionName,
    passphrase,
    error,
    isSubmitting,
    changeSessionName,
    changePassphrase,
    submit,
  };
}
