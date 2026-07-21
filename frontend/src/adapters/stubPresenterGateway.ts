import type { PresenterGateway } from "../ports/presenterGateway";

/** Stub adapter: fixed data until a real backend adapter exists. */
export const stubPresenterGateway: PresenterGateway = {
  sessionIdentity: () => "stub-session",
};
