import { NEVER, of, throwError } from "rxjs";
import {
  IntentRejectionCode,
  type IntentResult,
} from "../../domain/intentResult";
import { createFacilitatorLifecyclePort } from "../facilitatorLifecycleAdapter";
import type { WebsocketConnection } from "../websocketConnection";

function connectionAnswering(result: unknown): {
  connection: WebsocketConnection;
  invoke: jest.Mock;
} {
  const invoke = jest.fn(() => of(result));

  return {
    connection: {
      connectionState: NEVER,
      start: () => NEVER as never,
      stop: () => NEVER as never,
      on: () => NEVER,
      invoke,
    },
    invoke,
  };
}

describe("facilitator lifecycle port", () => {
  it("invokes AdvancePhase and reports acceptance", () => {
    const { connection, invoke } = connectionAnswering({
      isAccepted: true,
      code: null,
      detail: null,
    });

    const results: IntentResult[] = [];
    createFacilitatorLifecyclePort(connection)
      .advancePhase()
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("AdvancePhase");
    expect(results).toEqual([{ isAccepted: true, code: null, detail: null }]);
  });

  it("reports a typed rejection code", () => {
    const { connection } = connectionAnswering({
      isAccepted: false,
      code: 1,
      detail: "the workshop is already in its last phase",
    });

    const results: IntentResult[] = [];
    createFacilitatorLifecyclePort(connection)
      .advancePhase()
      .subscribe((result) => results.push(result));

    expect(results[0].code).toBe(IntentRejectionCode.WrongPhase);
  });

  it("errors when the hub answers something that is not an intent result", () => {
    const { connection } = connectionAnswering({ accepted: "yes" });

    let failed = false;
    createFacilitatorLifecyclePort(connection)
      .advancePhase()
      .subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
  });

  it("surfaces a transport failure to the caller", () => {
    const connection: WebsocketConnection = {
      connectionState: NEVER,
      start: () => NEVER as never,
      stop: () => NEVER as never,
      on: () => NEVER,
      invoke: () => throwError(() => new Error("connection is closed")),
    };

    const errors: Error[] = [];
    createFacilitatorLifecyclePort(connection)
      .advancePhase()
      .subscribe({ error: (error: Error) => errors.push(error) });

    expect(errors[0].message).toBe("connection is closed");
  });
});
