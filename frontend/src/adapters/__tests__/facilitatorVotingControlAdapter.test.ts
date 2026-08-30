import { NEVER, of } from "rxjs";
import type { IntentResult } from "../../domain/intentResult";
import { createFacilitatorVotingControlPort } from "../facilitatorVotingControlAdapter";
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

describe("facilitator voting control port", () => {
  it("invokes CloseVoting and reports acceptance", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    const results: IntentResult[] = [];
    createFacilitatorVotingControlPort(connection)
      .closeVoting()
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("CloseVoting");
    expect(results).toEqual([accepted]);
  });

  it("invokes StartTiebreakRound", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    createFacilitatorVotingControlPort(connection)
      .startTiebreakRound()
      .subscribe();

    expect(invoke).toHaveBeenCalledWith("StartTiebreakRound");
  });

  it("errors when the hub answers something that is not an intent result", () => {
    const { connection } = connectionAnswering({ accepted: "yes" });

    let failed = false;
    createFacilitatorVotingControlPort(connection)
      .closeVoting()
      .subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
  });
});
