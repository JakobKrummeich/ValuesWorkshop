import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const groupFormationMessages = {
  [MessageKey.GroupFormationFormingGroups]: {
    [Language.German]: "Gruppen werden gebildet\u2026",
    [Language.English]: "Forming groups\u2026",
  },
  [MessageKey.GroupFormationYourGroup]: {
    [Language.German]: "Deine Gruppe",
    [Language.English]: "Your group",
  },
  [MessageKey.GroupFormationFindEachOther]: {
    [Language.German]: "Findet euch im Raum zusammen.",
    [Language.English]: "Find each other in the room.",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
