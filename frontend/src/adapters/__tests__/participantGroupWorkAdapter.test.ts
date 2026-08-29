import { NEVER, of } from "rxjs";
import {
  IntentRejectionCode,
  type IntentResult,
} from "../../domain/intentResult";
import { createParticipantGroupWorkPort } from "../participantGroupWorkAdapter";
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

// WHY: the five method names below are the wire contract with
// backend/Adapters.Web/ParticipantHub.cs. The websocket connection dispatches
// them as strings, so neither TypeScript nor the C# compiler notices when a
// name, an argument order or the submission payload shape drifts — the scribe
// simply loses the group's work at runtime. Commit a8e3540 ("Fix port
// signatures to match backend hub methods") is what that drift looked like.
describe("participant group work port", () => {
  it("invokes AddAction with the value the action belongs to", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    const results: IntentResult[] = [];
    createParticipantGroupWorkPort(connection)
      .addAction("honesty")
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("AddAction", "honesty");
    expect(results).toEqual([accepted]);
  });

  it("invokes EditAction with the action id and its new text", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    const results: IntentResult[] = [];
    createParticipantGroupWorkPort(connection)
      .editAction("action-1", "We speak openly about mistakes")
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith(
      "EditAction",
      "action-1",
      "We speak openly about mistakes",
    );
    expect(results).toEqual([accepted]);
  });

  it("invokes RemoveAction with the action id", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    const results: IntentResult[] = [];
    createParticipantGroupWorkPort(connection)
      .removeAction("action-1")
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("RemoveAction", "action-1");
    expect(results).toEqual([accepted]);
  });

  it("invokes SubmitGroupWork with every assigned value and its actions", () => {
    const { connection, invoke } = connectionAnswering(accepted);
    const values = [
      {
        valueId: "honesty",
        actions: [{ actionId: "action-1", text: "We speak openly" }],
      },
      { valueId: "courage", actions: [] },
    ];

    const results: IntentResult[] = [];
    createParticipantGroupWorkPort(connection)
      .submitGroupWork(values)
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("SubmitGroupWork", values);
    expect(results).toEqual([accepted]);
  });

  it("invokes ReopenGroupWork without a payload", () => {
    const { connection, invoke } = connectionAnswering(accepted);

    const results: IntentResult[] = [];
    createParticipantGroupWorkPort(connection)
      .reopenGroupWork()
      .subscribe((result) => results.push(result));

    expect(invoke).toHaveBeenCalledWith("ReopenGroupWork");
    expect(results).toEqual([accepted]);
  });

  it("reports a typed rejection when the hub refuses a submission", () => {
    const { connection } = connectionAnswering({
      isAccepted: false,
      code: 4,
      detail: "the group work is already submitted",
    });

    const results: IntentResult[] = [];
    createParticipantGroupWorkPort(connection)
      .submitGroupWork([])
      .subscribe((result) => results.push(result));

    expect(results).toEqual([
      {
        isAccepted: false,
        code: IntentRejectionCode.InvariantViolated,
        detail: "the group work is already submitted",
      },
    ]);
  });
});
