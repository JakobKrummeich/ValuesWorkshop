import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const selectionMessages = {
  [MessageKey.SelectionPrompt]: {
    [Language.German]: "Wählt eure 10 Werte",
    [Language.English]: "Pick your 10 values",
  },
  [MessageKey.SelectionChoosePrompt]: {
    [Language.German]: "Wähle genau 10 Werte",
    [Language.English]: "Pick exactly 10 values",
  },
  [MessageKey.SelectionSelectedCount]: {
    [Language.German]: "Ausgewählt: {selected}/{total}",
    [Language.English]: "Selected: {selected}/{total}",
  },
  [MessageKey.SelectionPickMore]: {
    [Language.German]: "Noch {count} wählen",
    [Language.English]: "Pick {count} more",
  },
  [MessageKey.SelectionSubmit]: {
    [Language.German]: "Auswahl abgeben",
    [Language.English]: "Submit selection",
  },
  [MessageKey.SelectionConfirmTitle]: {
    [Language.German]: "Auswahl endgültig abgeben?",
    [Language.English]: "Submit your selection for good?",
  },
  [MessageKey.SelectionConfirmBody]: {
    [Language.German]: "Die Auswahl kann danach nicht mehr geändert werden.",
    [Language.English]: "Your selection cannot be changed afterwards.",
  },
  [MessageKey.SelectionConfirmSubmit]: {
    [Language.German]: "Abgeben",
    [Language.English]: "Submit",
  },
  [MessageKey.SelectionConfirmCancel]: {
    [Language.German]: "Abbrechen",
    [Language.English]: "Cancel",
  },
  [MessageKey.SelectionSubmittedHeading]: {
    [Language.German]: "Abgabe erfolgreich",
    [Language.English]: "Submission successful",
  },
  [MessageKey.SelectionSubmittedBody]: {
    [Language.German]: "Deine Auswahl ist abgegeben.",
    [Language.English]: "Your selection has been submitted.",
  },
  [MessageKey.SelectionSubmittedCount]: {
    [Language.German]: "{submitted} von {total} haben abgegeben",
    [Language.English]: "{submitted} of {total} have submitted",
  },
  [MessageKey.SelectionSubmittedOfTotal]: {
    [Language.German]: "von {total} haben abgegeben",
    [Language.English]: "of {total} have submitted",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
