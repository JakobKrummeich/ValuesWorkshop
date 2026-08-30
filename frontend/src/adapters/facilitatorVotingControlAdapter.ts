import type { FacilitatorVotingControlPort } from "../domain/ports/facilitator/votingControlPort";
import { FacilitatorIntent } from "../domain/workshopState";
import { invokeIntent } from "./intentInvocation";
import type { WebsocketConnection } from "./websocketConnection";

export function createFacilitatorVotingControlPort(
  connection: WebsocketConnection,
): FacilitatorVotingControlPort {
  return {
    closeVoting: () => invokeIntent(connection, FacilitatorIntent.CloseVoting),
    startTiebreakRound: () =>
      invokeIntent(connection, FacilitatorIntent.StartTiebreakRound),
  };
}
