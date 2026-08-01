import { IntentRejectionCode, intentResultSchema } from "../intentResult";

describe("intent result", () => {
  it("parses every rejection code the backend can send", () => {
    const codes = [
      IntentRejectionCode.WrongPhase,
      IntentRejectionCode.NotAuthorized,
      IntentRejectionCode.UnknownSession,
      IntentRejectionCode.InvariantViolated,
      IntentRejectionCode.MalformedPayload,
      IntentRejectionCode.UnknownParticipant,
      IntentRejectionCode.ConcurrencyConflict,
    ];

    expect(codes).toEqual([1, 2, 3, 4, 5, 6, 7]);

    for (const code of codes) {
      expect(
        intentResultSchema.parse({
          isAccepted: false,
          code,
          detail: "rejected",
        }).code,
      ).toBe(code);
    }
  });

  it("rejects a code the frontend does not know", () => {
    expect(() =>
      intentResultSchema.parse({ isAccepted: false, code: 99, detail: null }),
    ).toThrow();
  });
});
