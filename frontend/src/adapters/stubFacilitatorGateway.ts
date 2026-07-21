import type { FacilitatorGateway } from "../ports/facilitatorGateway";

/** Stub adapter: fixed data until a real backend adapter exists. */
export const stubFacilitatorGateway: FacilitatorGateway = {
  sessionIdentity: () => "stub-session",
};
