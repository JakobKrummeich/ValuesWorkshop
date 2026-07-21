import type { PresenterGateway } from "../ports/presenterGateway";

export const stubPresenterGateway: PresenterGateway = {
  sessionIdentity: () => "stub-session",
};
