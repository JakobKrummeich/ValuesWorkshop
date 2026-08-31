import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const finalPresentationMessages = {
  [MessageKey.FinalPresentationRevealedCount]: {
    [Language.German]: "Enthüllt: {revealed} von {total}",
    [Language.English]: "Revealed: {revealed} of {total}",
  },
  [MessageKey.FinalPresentationRevealNext]: {
    [Language.German]: "Nächsten Wert enthüllen",
    [Language.English]: "Reveal next value",
  },
  [MessageKey.FinalPresentationConcluded]: {
    [Language.German]:
      "Alle Gewinner sind enthüllt — der Workshop ist abgeschlossen.",
    [Language.English]: "All winners are revealed — the workshop is concluded.",
  },
  [MessageKey.FinalPresentationAnticipation]: {
    [Language.German]: "Und die Gewinner sind …",
    [Language.English]: "And the winners are …",
  },
  [MessageKey.FinalPresentationPlace]: {
    [Language.German]: "Platz {place}",
    [Language.English]: "Place {place}",
  },
  [MessageKey.FinalPresentationVoteCount]: {
    [Language.German]: "{count} Stimmen",
    [Language.English]: "{count} votes",
  },
  [MessageKey.FinalPresentationVoteCountSingle]: {
    [Language.German]: "1 Stimme",
    [Language.English]: "1 vote",
  },
  [MessageKey.FinalPresentationActions]: {
    [Language.German]: "Aktionen",
    [Language.English]: "Actions",
  },
  [MessageKey.FinalPresentationOverviewHeading]: {
    [Language.German]: "Die Gewinner",
    [Language.English]: "The winners",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
