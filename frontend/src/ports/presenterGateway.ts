/** Driving port: entry of the presenter screens into the session. */
export interface PresenterGateway {
  sessionIdentity(): string;
}
