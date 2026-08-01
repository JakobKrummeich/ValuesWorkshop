import { z } from "zod";

export enum IntentRejectionCode {
  WrongPhase = 1,
  NotAuthorized = 2,
  UnknownSession = 3,
  InvariantViolated = 4,
  MalformedPayload = 5,
  UnknownParticipant = 6,
}

export const intentResultSchema = z.object({
  isAccepted: z.boolean(),
  code: z.enum(IntentRejectionCode).nullable(),
  detail: z.string().nullable(),
});

export type IntentResult = z.infer<typeof intentResultSchema>;
