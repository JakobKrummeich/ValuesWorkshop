import type { ParticipantGateway } from "../ports/participantGateway";

export const stubParticipantGateway: ParticipantGateway = {
  sessionIdentity: () => "stub-session",
};
