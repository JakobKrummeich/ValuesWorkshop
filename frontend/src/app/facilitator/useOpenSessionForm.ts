"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Subscription } from "rxjs";
import { navigateTo, sessionUrl } from "../../adapters/browserLocation";
import { MessageKey } from "../../domain/i18n/messages";
import type { FacilitatorSessionCreationPort } from "../../domain/ports/facilitator/sessionCreationPort";
import {
  maximumSessionNameLength,
  SessionCreationFailure,
  type SessionCreationOutcome,
} from "../../domain/sessionCreation";
import { useTranslation } from "../i18n/useTranslation";

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
  const { translate } = useTranslation();

  const failureMessage = useCallback(
    (failure: SessionCreationFailure) =>
      translate(messageByFailure[failure], {
        limit: maximumSessionNameLength,
      }),
    [translate],
  );

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
        setErrorMessage(translate(MessageKey.OpenSessionNameRequired));
        return;
      }

      setErrorMessage(null);
      setSubmitting(true);
      inFlightCreation.current?.unsubscribe();

      inFlightCreation.current = sessionCreation
        .openSession(requestedName, passphrase)
        .subscribe({
          next(outcome: SessionCreationOutcome) {
            setPassphrase("");

            if (!outcome.isCreated) {
              setErrorMessage(failureMessage(outcome.failure));
              setSubmitting(false);
              return;
            }

            navigateTo(sessionUrl(FACILITATOR_PATH, outcome.sessionIdentity));
          },
          error() {
            setErrorMessage(failureMessage(SessionCreationFailure.Unexpected));
            setPassphrase("");
            setSubmitting(false);
          },
        });
    },
    [sessionCreation, sessionName, passphrase, translate, failureMessage],
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
