import { IntentRejectionCode } from "../intentResult";
import { MessageKey } from "./messages";

const intentRejectionMessages: Readonly<
  Record<IntentRejectionCode, MessageKey>
> = {
  [IntentRejectionCode.WrongPhase]: MessageKey.IntentWrongPhase,
  [IntentRejectionCode.NotAuthorized]: MessageKey.IntentNotAuthorized,
  [IntentRejectionCode.UnknownSession]: MessageKey.IntentUnknownSession,
  [IntentRejectionCode.InvariantViolated]: MessageKey.IntentInvariantViolated,
  [IntentRejectionCode.MalformedPayload]: MessageKey.IntentMalformedPayload,
  [IntentRejectionCode.UnknownParticipant]: MessageKey.IntentUnknownParticipant,
  [IntentRejectionCode.ConcurrencyConflict]:
    MessageKey.IntentConcurrencyConflict,
};

export function intentRejectionMessage(
  code: IntentRejectionCode | null,
): MessageKey {
  return code === null
    ? MessageKey.IntentFailed
    : intentRejectionMessages[code];
}
