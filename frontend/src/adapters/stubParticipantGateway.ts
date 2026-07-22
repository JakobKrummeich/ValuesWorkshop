import type { ParticipantGateway } from "../domain/ports/participantGateway";

export const stubParticipantGateway: ParticipantGateway = {
  sessionIdentity: () => "stub-session",
};
