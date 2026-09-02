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
  [MessageKey.FinalPresentationConcludedHeading]: {
    [Language.German]: "Workshop abgeschlossen",
    [Language.English]: "Workshop concluded",
  },
  [MessageKey.FinalPresentationThanks]: {
    [Language.German]: "Danke fürs Mitmachen!",
    [Language.English]: "Thanks for taking part!",
  },
  [MessageKey.FinalPresentationDownloadPdf]: {
    [Language.German]: "Workshop-Protokoll (PDF) herunterladen",
    [Language.English]: "Download workshop record (PDF)",
  },
  [MessageKey.FinalPresentationDownloadFailed]: {
    [Language.German]:
      "Der Download ist fehlgeschlagen — bitte erneut versuchen.",
    [Language.English]: "The download failed — please try again.",
  },
  [MessageKey.FinalPresentationRecordTitle]: {
    [Language.German]: "Workshop-Protokoll",
    [Language.English]: "Workshop record",
  },
  [MessageKey.FinalPresentationRecordFileName]: {
    [Language.German]: "werte-workshop-protokoll.pdf",
    [Language.English]: "values-workshop-record.pdf",
  },
  [MessageKey.FinalPresentationRecordAllActionsHeading]: {
    [Language.German]: "Alle Aktionen",
    [Language.English]: "All actions",
  },
  [MessageKey.FinalPresentationRecordRoundsHeading]: {
    [Language.German]: "Stimmen pro Runde",
    [Language.English]: "Votes per round",
  },
  [MessageKey.FinalPresentationRecordRoundTitle]: {
    [Language.German]: "Runde {round} — {allotment} Stimmen pro Person",
    [Language.English]: "Round {round} — {allotment} votes per person",
  },
  [MessageKey.FinalPresentationRecordRoundTitleSingle]: {
    [Language.German]: "Runde {round} — 1 Stimme pro Person",
    [Language.English]: "Round {round} — 1 vote per person",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
