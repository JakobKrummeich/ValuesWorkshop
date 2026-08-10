import { NEVER, of, throwError } from "rxjs";
import {
  IntentRejectionCode,
  type IntentResult,
} from "../../domain/intentResult";
import { createParticipantQuizPort } from "../participantQuizAdapter";
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

describe("participant quiz port", () => {
  it("invokes ChooseQuizAnswer with question and answer index", () => {
    const { connection, invoke } = connectionAnswering({
      isAccepted: true,
      code: null,
      detail: null,
    });

    const results: IntentResult[] = [];
    createParticipantQuizPort(connection)
      .chooseAnswer(2, 1)
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("ChooseQuizAnswer", 2, 1);
    expect(results).toEqual([{ isAccepted: true, code: null, detail: null }]);
  });

  it("reports a typed rejection code", () => {
    const { connection } = connectionAnswering({
      isAccepted: false,
      code: 4,
      detail: "the answer is already cast",
    });

    const results: IntentResult[] = [];
    createParticipantQuizPort(connection)
      .chooseAnswer(0, 0)
      .subscribe((result) => results.push(result));

    expect(results[0].code).toBe(IntentRejectionCode.InvariantViolated);
  });

  it("errors when the hub answers something that is not an intent result", () => {
    const { connection } = connectionAnswering({ accepted: "yes" });

    let failed = false;
    createParticipantQuizPort(connection)
      .chooseAnswer(0, 0)
      .subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
  });

  it("surfaces a transport failure to the caller", () => {
    const connection: WebsocketConnection = {
      connectionState: NEVER,
      start: NEVER,
      stop: NEVER,
      on: () => NEVER,
      invoke: () => throwError(() => new Error("connection is closed")),
    };

    const errors: Error[] = [];
    createParticipantQuizPort(connection)
      .chooseAnswer(0, 0)
      .subscribe({ error: (error: Error) => errors.push(error) });

    expect(errors[0].message).toBe("connection is closed");
  });
});
