import type { ParticipantVotingPort } from "../domain/ports/participant/votingPort";
import { ParticipantIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createParticipantVotingPort(
  connection: WebsocketConnection,
): ParticipantVotingPort {
  return {
    submitFinalVotes: (votes) =>
      invokeIntent(connection, ParticipantIntent.SubmitFinalVotes, votes),
  };
}
