import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const selectionResultsMessages = {
  [MessageKey.SelectionResultsHeading]: {
    [Language.German]: "Eure Top-Werte",
    [Language.English]: "Your top values",
  },
  [MessageKey.SelectionResultsHiddenValues]: {
    [Language.German]: "und {count} weitere",
    [Language.English]: "and {count} more",
  },
  [MessageKey.SelectionResultsNoSubmissions]: {
    [Language.German]: "Niemand hat eine Auswahl abgegeben.",
    [Language.English]: "Nobody submitted a selection.",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
