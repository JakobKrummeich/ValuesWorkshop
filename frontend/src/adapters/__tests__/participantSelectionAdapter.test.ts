import { NEVER, of } from "rxjs";
import {
  IntentRejectionCode,
  type IntentResult,
} from "../../domain/intentResult";
import { createParticipantSelectionPort } from "../participantSelectionAdapter";
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

const tenValueIds = Array.from({ length: 10 }, (_, index) => `value-${index}`);

describe("participant selection port", () => {
  it("invokes SubmitValueSelection with the chosen value ids", () => {
    const { connection, invoke } = connectionAnswering({
      isAccepted: true,
      code: null,
      detail: null,
    });

    const results: IntentResult[] = [];
    createParticipantSelectionPort(connection)
      .submitSelection(tenValueIds)
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("SubmitValueSelection", tenValueIds);
    expect(results).toEqual([{ isAccepted: true, code: null, detail: null }]);
  });

  it("reports a typed rejection code", () => {
    const { connection } = connectionAnswering({
      isAccepted: false,
      code: 4,
      detail: "the selection is already submitted",
    });

    const results: IntentResult[] = [];
    createParticipantSelectionPort(connection)
      .submitSelection(tenValueIds)
      .subscribe((result) => results.push(result));

    expect(results).toEqual([
      {
        isAccepted: false,
        code: IntentRejectionCode.InvariantViolated,
        detail: "the selection is already submitted",
      },
    ]);
  });
});
