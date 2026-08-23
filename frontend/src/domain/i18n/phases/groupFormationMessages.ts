import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const groupFormationMessages = {
  [MessageKey.GroupFormationFormingGroups]: {
    [Language.German]: "Gruppen werden gebildet\u2026",
    [Language.English]: "Forming groups\u2026",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
