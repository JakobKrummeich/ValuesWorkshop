import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const valuePresentationMessages = {
  [MessageKey.ValuePresentationUpNext]: {
    [Language.German]: "Als Nächstes",
    [Language.English]: "Up next",
  },
  [MessageKey.ValuePresentationUpNextGroup]: {
    [Language.German]: "Als Nächstes: {group}",
    [Language.English]: "Up next: {group}",
  },
  [MessageKey.ValuePresentationPresenting]: {
    [Language.German]: "Es präsentiert: {group} · {value}",
    [Language.English]: "Presenting: {group} · {value}",
  },
  [MessageKey.ValuePresentationActions]: {
    [Language.German]: "Aktionen",
    [Language.English]: "Actions",
  },
  [MessageKey.ValuePresentationNextValue]: {
    [Language.German]: "Nächster Wert",
    [Language.English]: "Next value",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
