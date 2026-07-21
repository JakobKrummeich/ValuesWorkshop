/** Driving port: entry of the participant screens into the session. */
export interface ParticipantGateway {
  sessionIdentity(): string;
}
