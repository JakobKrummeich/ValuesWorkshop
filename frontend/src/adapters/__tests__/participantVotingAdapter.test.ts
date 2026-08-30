import { NEVER, of } from "rxjs";
import type { IntentResult } from "../../domain/intentResult";
import { createParticipantVotingPort } from "../participantVotingAdapter";
import type { WebsocketConnection } from "../websocketConnection";

function connectionAnswering(result: unknown): {
  connection: WebsocketConnection;
  invoke: jest.Mock;
} {
  const invoke = jest.fn(() => of(result));

  return {
    connection: {
      connectionState: NEVER,
      start: NEVER,
      stop: NEVER,
      on: () => NEVER,
      invoke,
    },
    invoke,
  };
}

const accepted = { isAccepted: true, code: null, detail: null };

describe("participant voting port", () => {
  it("invokes SubmitFinalVotes with the ballot and reports acceptance", () => {
    const { connection, invoke } = connectionAnswering(accepted);
    const votes = [
      { valueId: "wert-1", voteCount: 3 },
      { valueId: "wert-2", voteCount: 2 },
    ];

    const results: IntentResult[] = [];
    createParticipantVotingPort(connection)
      .submitFinalVotes(votes)
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("SubmitFinalVotes", votes);
    expect(results).toEqual([accepted]);
  });

  it("errors when the hub answers something that is not an intent result", () => {
    const { connection } = connectionAnswering({ accepted: "yes" });

    let failed = false;
    createParticipantVotingPort(connection)
      .submitFinalVotes([{ valueId: "wert-1", voteCount: 5 }])
      .subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
  });
});
