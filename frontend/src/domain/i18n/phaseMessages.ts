import { Language } from "./language";
import type { Message } from "./message";
import { MessageKey } from "./messageKey";

export const phaseMessages = {
  [MessageKey.OpenSessionTitle]: {
    [Language.German]: "ValuesWorkshop · Workshop eröffnen",
    [Language.English]: "ValuesWorkshop · Open a session",
  },
  [MessageKey.OpenSessionName]: {
    [Language.German]: "Workshop-Name",
    [Language.English]: "Session name",
  },
  [MessageKey.OpenSessionPassphrase]: {
    [Language.German]: "Moderations-Passwort",
    [Language.English]: "Facilitator passphrase",
  },
  [MessageKey.OpenSessionSubmit]: {
    [Language.German]: "Workshop eröffnen",
    [Language.English]: "Open session",
  },
  [MessageKey.OpenSessionSubmitting]: {
    [Language.German]: "Wird eröffnet\u2026",
    [Language.English]: "Opening\u2026",
  },
  [MessageKey.OpenSessionNameRequired]: {
    [Language.German]: "Bitte einen Workshop-Namen eingeben.",
    [Language.English]: "Enter a session name.",
  },
  [MessageKey.OpenSessionSignInExpired]: {
    [Language.German]:
      "Die Anmeldung ist abgelaufen. Bitte erneut anmelden, um einen Workshop zu eröffnen.",
    [Language.English]:
      "Your sign-in has expired. Sign in again to open a session.",
  },
  [MessageKey.OpenSessionPassphraseRejected]: {
    [Language.German]: "Dieses Moderations-Passwort wurde nicht akzeptiert.",
    [Language.English]: "That facilitator passphrase was not accepted.",
  },
  [MessageKey.OpenSessionNameRejected]: {
    [Language.German]:
      "Dieser Workshop-Name wurde nicht akzeptiert. Bitte höchstens {limit} Zeichen verwenden.",
    [Language.English]:
      "That session name was not accepted. Use up to {limit} characters.",
  },
  [MessageKey.OpenSessionUnexpected]: {
    [Language.German]:
      "Der Workshop konnte nicht eröffnet werden. Bitte erneut versuchen.",
    [Language.English]: "The session could not be opened. Please try again.",
  },
  [MessageKey.AdvancePhase]: {
    [Language.German]: "Phase weiterschalten",
    [Language.English]: "Advance phase",
  },
  [MessageKey.JoinYouAreIn]: {
    [Language.German]: "Du bist dabei, {name}.",
    [Language.English]: "You are in, {name}.",
  },
  [MessageKey.JoinWaitingForStart]: {
    [Language.German]: "Warten auf den Start des Workshops\u2026",
    [Language.English]: "Waiting for the workshop to start\u2026",
  },
  [MessageKey.JoinParticipantCount]: {
    [Language.German]: "Teilnehmende: {count}",
    [Language.English]: "Participants: {count}",
  },
  [MessageKey.JoinScanToJoin]: {
    [Language.German]: "Zum Mitmachen scannen",
    [Language.English]: "Scan to join",
  },
  [MessageKey.JoinAlreadyHere]: {
    [Language.German]: "Schon dabei",
    [Language.English]: "Already here",
  },
  [MessageKey.JoinNobodyYet]: {
    [Language.German]: "Noch niemand dabei",
    [Language.English]: "Nobody has joined yet",
  },
  [MessageKey.JoinCopyUrl]: {
    [Language.German]: "Beitrittslink kopieren",
    [Language.English]: "Copy join link",
  },
  [MessageKey.JoinUrlCopied]: {
    [Language.German]: "Link kopiert",
    [Language.English]: "Link copied",
  },
  [MessageKey.JoinUrlCopyFailed]: {
    [Language.German]: "Der Link konnte nicht kopiert werden.",
    [Language.English]: "The link could not be copied.",
  },
  [MessageKey.QuizQuestionHeading]: {
    [Language.German]: "Frage {n} von {total}",
    [Language.English]: "Question {n} of {total}",
  },
  [MessageKey.QuizOwnAnswerLabel]: {
    [Language.German]: "Deine Antwort:",
    [Language.English]: "Your answer:",
  },
  [MessageKey.QuizAnsweredCount]: {
    [Language.German]: "{answered} von {total} haben geantwortet",
    [Language.English]: "{answered} of {total} have answered",
  },
  [MessageKey.QuizVoteCount]: {
    [Language.German]: "Stimmen: {count}",
    [Language.English]: "Votes: {count}",
  },
  [MessageKey.QuizCorrectAnswer]: {
    [Language.German]: "Richtige Antwort",
    [Language.English]: "Correct answer",
  },
  [MessageKey.QuizLearningTextHeading]: {
    [Language.German]: "Lerntext",
    [Language.English]: "Learning text",
  },
  [MessageKey.QuizRevealAnswer]: {
    [Language.German]: "Antwort aufdecken",
    [Language.English]: "Reveal answer",
  },
  [MessageKey.QuizShowLearningText]: {
    [Language.German]: "Lerntext zeigen",
    [Language.English]: "Show learning text",
  },
  [MessageKey.QuizNextQuestion]: {
    [Language.German]: "Nächste Frage",
    [Language.English]: "Next question",
  },
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
  [MessageKey.SelectionSubmittedNotice]: {
    [Language.German]: "Deine Auswahl ist abgegeben.",
    [Language.English]: "Your selection has been submitted.",
  },
  [MessageKey.SelectionSubmittedCount]: {
    [Language.German]: "{submitted} von {total} haben abgegeben",
    [Language.English]: "{submitted} of {total} have submitted",
  },
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
  [MessageKey.WaitingWatchWall]: {
    [Language.German]: "Schaut auf die Präsentationswand",
    [Language.English]: "Look at the presenter wall",
  },
  [MessageKey.GroupFormationWaitingForGroup]: {
    [Language.German]: "Deine Gruppe wird gerade gebildet\u2026",
    [Language.English]: "Your group is being formed\u2026",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
