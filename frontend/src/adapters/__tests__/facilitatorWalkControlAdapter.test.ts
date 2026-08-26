import { NEVER, of } from "rxjs";
import type { IntentResult } from "../../domain/intentResult";
import { createFacilitatorWalkControlPort } from "../facilitatorWalkControlAdapter";
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

describe("facilitator walk control port", () => {
  it("invokes GoToNextValue and reports acceptance", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    const results: IntentResult[] = [];
    createFacilitatorWalkControlPort(connection)
      .goToNextValue()
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("GoToNextValue");
    expect(results).toEqual([accepted]);
  });

  it("invokes CorrectActionWording with the action id and text", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    const results: IntentResult[] = [];
    createFacilitatorWalkControlPort(connection)
      .correctActionWording("action-1", "We speak openly")
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith(
      "CorrectActionWording",
      "action-1",
      "We speak openly",
    );
    expect(results).toEqual([accepted]);
  });

  it("errors when the hub answers something that is not an intent result", () => {
    const { connection } = connectionAnswering({ accepted: "yes" });

    let failed = false;
    createFacilitatorWalkControlPort(connection)
      .goToNextValue()
      .subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
  });
});
