import { NEVER, of } from "rxjs";
import type { IntentResult } from "../../domain/intentResult";
import type { FacilitatorQuizControlPort } from "../../domain/ports/facilitator/quizControlPort";
import { createFacilitatorQuizControlPort } from "../facilitatorQuizControlAdapter";
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

const controls: Array<{
  portMethod: keyof FacilitatorQuizControlPort;
  hubMethod: string;
}> = [
  { portMethod: "revealAnswer", hubMethod: "RevealAnswer" },
  { portMethod: "showLearningText", hubMethod: "ShowLearningText" },
  { portMethod: "poseNextQuestion", hubMethod: "PoseNextQuestion" },
];

describe("facilitator quiz control port", () => {
  it.each(controls)(
    "invokes $hubMethod and reports acceptance",
    ({ portMethod, hubMethod }) => {
      const { connection, invoke } = connectionAnswering({
        isAccepted: true,
        code: null,
        detail: null,
      });

      const results: IntentResult[] = [];
      createFacilitatorQuizControlPort(connection)
        [portMethod]()
        .subscribe((result) => results.push(result));

      expect(invoke).toHaveBeenCalledWith(hubMethod);
      expect(results).toEqual([{ isAccepted: true, code: null, detail: null }]);
    },
  );

  it("errors when the hub answers something that is not an intent result", () => {
    const { connection } = connectionAnswering({ accepted: "yes" });

    let failed = false;
    createFacilitatorQuizControlPort(connection)
      .revealAnswer()
      .subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
  });
});
