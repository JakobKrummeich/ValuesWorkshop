import type { ParticipantGateway } from "../domain/participantGateway";

export const stubParticipantGateway: ParticipantGateway = {
  sessionIdentity: () => "stub-session",
};
