import type { FacilitatorGateway } from "../ports/facilitatorGateway";

export const stubFacilitatorGateway: FacilitatorGateway = {
  sessionIdentity: () => "stub-session",
};
