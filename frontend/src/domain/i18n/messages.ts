import type { Message } from "./message";
import { MessageKey } from "./messageKey";
import { phaseMessages } from "./phaseMessages";
import { shellMessages } from "./shellMessages";

export { MessageKey } from "./messageKey";

export const messages: Readonly<Record<MessageKey, Message>> = {
  ...shellMessages,
  ...phaseMessages,
};
