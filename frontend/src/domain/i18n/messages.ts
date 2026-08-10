import { Language } from "./language";
import { MessageKey } from "./messageKey";

export { MessageKey } from "./messageKey";

type Message = Readonly<Record<Language, string>>;

export const messages: Readonly<Record<MessageKey, Message>> = {
  [MessageKey.AuthChecking]: {
    [Language.German]: "Anmeldung wird geprüft\u2026",
    [Language.English]: "Checking authentication\u2026",
  },
  [MessageKey.AuthRedirecting]: {
    [Language.German]: "Weiterleitung zur Anmeldung\u2026",
    [Language.English]: "Redirecting to login\u2026",
  },
  [MessageKey.AuthProviderUnavailable]: {
    [Language.German]:
      "Der Anmeldedienst ist nicht erreichbar. Bitte später erneut versuchen.",
    [Language.English]:
      "Unable to connect to the login provider. Please try again later.",
  },
  [MessageKey.AuthCallbackCompleting]: {
    [Language.German]: "Anmeldung wird abgeschlossen\u2026",
    [Language.English]: "Completing login\u2026",
  },
  [MessageKey.AuthCallbackFailed]: {
    [Language.German]: "Anmeldefehler: {detail}",
    [Language.English]: "Authentication error: {detail}",
  },
  [MessageKey.AuthCallbackReturnHome]: {
    [Language.German]: "Zurück zur Startseite",
    [Language.English]: "Return to home",
  },
  [MessageKey.ConnectionConnecting]: {
    [Language.German]: "Verbindung wird aufgebaut",
    [Language.English]: "Connecting",
  },
  [MessageKey.ConnectionConnected]: {
    [Language.German]: "Verbunden",
    [Language.English]: "Connected",
  },
  [MessageKey.ConnectionReconnecting]: {
    [Language.German]: "Verbindung wird wiederhergestellt",
    [Language.English]: "Reconnecting",
  },
  [MessageKey.ConnectionDisconnected]: {
    [Language.German]: "Getrennt",
    [Language.English]: "Disconnected",
  },
  [MessageKey.LanguageGerman]: {
    [Language.German]: "Deutsch",
    [Language.English]: "German",
  },
  [MessageKey.LanguageEnglish]: {
    [Language.German]: "Englisch",
    [Language.English]: "English",
  },
  [MessageKey.LanguageSwitcherLabel]: {
    [Language.German]: "Sprache",
    [Language.English]: "Language",
  },
  [MessageKey.MissingSession]: {
    [Language.German]:
      "Dieser Link enthält keinen Workshop. Bitte den QR-Code erneut scannen.",
    [Language.English]:
      "This link carries no workshop session. Please scan the QR code again.",
  },
  [MessageKey.SessionPhase]: {
    [Language.German]: "Phase {phase}",
    [Language.English]: "Phase {phase}",
  },
  [MessageKey.SessionWaiting]: {
    [Language.German]: "Warten auf den Workshop\u2026",
    [Language.English]: "Waiting for the workshop\u2026",
  },
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
  [MessageKey.IntentWrongPhase]: {
    [Language.German]: "In dieser Phase ist das nicht möglich.",
    [Language.English]: "That is not possible in this phase.",
  },
  [MessageKey.IntentNotAuthorized]: {
    [Language.German]: "Dazu fehlt die Berechtigung.",
    [Language.English]: "You are not allowed to do that.",
  },
  [MessageKey.IntentUnknownSession]: {
    [Language.German]: "Dieser Workshop ist unbekannt.",
    [Language.English]: "This workshop session is unknown.",
  },
  [MessageKey.IntentInvariantViolated]: {
    [Language.German]: "Der Workshop lässt diesen Schritt gerade nicht zu.",
    [Language.English]: "The workshop does not allow that step right now.",
  },
  [MessageKey.IntentMalformedPayload]: {
    [Language.German]: "Die Anfrage war fehlerhaft.",
    [Language.English]: "That request was malformed.",
  },
  [MessageKey.IntentUnknownParticipant]: {
    [Language.German]: "Diese Teilnahme ist unbekannt.",
    [Language.English]: "This participant is unknown.",
  },
  [MessageKey.IntentConcurrencyConflict]: {
    [Language.German]:
      "Der Workshop hat sich zwischenzeitlich geändert. Bitte erneut versuchen.",
    [Language.English]:
      "The workshop changed in the meantime. Please try again.",
  },
  [MessageKey.IntentFailed]: {
    [Language.German]: "Die Aktion ist fehlgeschlagen. Bitte erneut versuchen.",
    [Language.English]: "That action failed. Please try again.",
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
  [MessageKey.FacilitatorHeading]: {
    [Language.German]: "Moderation",
    [Language.English]: "Facilitator",
  },
  [MessageKey.ParticipantHeading]: {
    [Language.German]: "Teilnahme",
    [Language.English]: "Participant",
  },
  [MessageKey.PresenterHeading]: {
    [Language.German]: "Präsentation",
    [Language.English]: "Presenter",
  },
};
