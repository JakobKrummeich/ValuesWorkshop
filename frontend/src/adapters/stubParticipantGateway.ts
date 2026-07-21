import type { ParticipantGateway } from "../ports/participantGateway";

/** Stub adapter: fixed data until a real backend adapter exists. */
export const stubParticipantGateway: ParticipantGateway = {
  sessionIdentity: () => "stub-session",
};
