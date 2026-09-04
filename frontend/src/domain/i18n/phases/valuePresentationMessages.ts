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
  [MessageKey.ValuePresentationPresents]: {
    [Language.German]: "präsentiert",
    [Language.English]: "presents",
  },
  [MessageKey.ValuePresentationPresenting]: {
    [Language.German]: "Es präsentiert: {group} · {value}",
    [Language.English]: "Presenting: {group} · {value}",
  },
  [MessageKey.ValuePresentationNextValue]: {
    [Language.German]: "Nächster Wert",
    [Language.English]: "Next value",
  },
  [MessageKey.ValuePresentationActionWording]: {
    [Language.German]: "Wortlaut der Aktion",
    [Language.English]: "Action wording",
  },
  [MessageKey.ValuePresentationEditHint]: {
    [Language.German]:
      "Wortlaut direkt in der Zeile korrigieren – Enter speichert, Escape verwirft.",
    [Language.English]:
      "Correct the wording right in the row – Enter saves, Escape reverts.",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
