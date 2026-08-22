import { Language } from "./language";
import type { Message } from "./message";
import { MessageKey } from "./messageKey";

export const applicationMessages = {
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
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
