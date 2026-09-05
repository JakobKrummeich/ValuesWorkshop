import { IntentRejectionCode } from "../../intentResult";
import { intentRejectionMessage } from "../intentRejectionMessage";
import { MessageKey } from "../messages";

describe("the message that explains a refused intent", () => {
  it("names the reason the server gave", () => {
    expect(intentRejectionMessage(IntentRejectionCode.WrongPhase)).toBe(
      MessageKey.IntentWrongPhase,
    );
    expect(
      intentRejectionMessage(IntentRejectionCode.ConcurrencyConflict),
    ).toBe(MessageKey.IntentConcurrencyConflict);
  });

  it("falls back to the unspecific failure when no reason arrived", () => {
    expect(intentRejectionMessage(null)).toBe(MessageKey.IntentFailed);
  });

  it("has a message for every reason the server can send", () => {
    const codes = Object.values(IntentRejectionCode).filter(
      (code) => typeof code === "number",
    );

    for (const code of codes) {
      expect(intentRejectionMessage(code)).not.toBeUndefined();
    }
  });
});
