import type { FacilitatorGateway } from "../domain/ports/facilitatorGateway";

export const stubFacilitatorGateway: FacilitatorGateway = {
  sessionIdentity: () => "stub-session",
};
