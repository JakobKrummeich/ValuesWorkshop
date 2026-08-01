export enum SessionCreationFailure {
  PassphraseRejected = "passphraseRejected",
  SessionNameRejected = "sessionNameRejected",
  Unexpected = "unexpected",
}

export interface SessionCreated {
  readonly isCreated: true;
  readonly sessionIdentity: string;
}

export interface SessionCreationRejected {
  readonly isCreated: false;
  readonly failure: SessionCreationFailure;
}

export type SessionCreationOutcome = SessionCreated | SessionCreationRejected;

export function sessionCreated(sessionIdentity: string): SessionCreated {
  return { isCreated: true, sessionIdentity };
}

export function sessionCreationRejected(
  failure: SessionCreationFailure,
): SessionCreationRejected {
  return { isCreated: false, failure };
}
