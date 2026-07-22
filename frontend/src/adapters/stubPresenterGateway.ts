import type { PresenterGateway } from "../domain/presenterGateway";

export const stubPresenterGateway: PresenterGateway = {
  sessionIdentity: () => "stub-session",
};
