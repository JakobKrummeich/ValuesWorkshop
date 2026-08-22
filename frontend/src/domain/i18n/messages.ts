import { applicationMessages } from "./applicationMessages";
import type { Message } from "./message";
import { MessageKey } from "./messageKey";
import { phaseMessages } from "./phaseMessages";

export { MessageKey } from "./messageKey";

export const messages: Readonly<Record<MessageKey, Message>> = {
  ...applicationMessages,
  ...phaseMessages,
};
