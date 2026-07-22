import type { FacilitatorGateway } from "../domain/facilitatorGateway";

export const stubFacilitatorGateway: FacilitatorGateway = {
  sessionIdentity: () => "stub-session",
};
