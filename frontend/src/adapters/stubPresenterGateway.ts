import type { PresenterGateway } from "../domain/ports/presenterGateway";

export const stubPresenterGateway: PresenterGateway = {
  sessionIdentity: () => "stub-session",
};
