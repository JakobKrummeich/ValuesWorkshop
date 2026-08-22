import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const groupFormationMessages = {
  [MessageKey.GroupFormationWaitingForGroup]: {
    [Language.German]: "Deine Gruppe wird gerade gebildet\u2026",
    [Language.English]: "Your group is being formed\u2026",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
