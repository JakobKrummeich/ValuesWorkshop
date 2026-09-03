import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const joinMessages = {
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
  [MessageKey.JoinJoined]: {
    [Language.German]: "dabei",
    [Language.English]: "joined",
  },
  [MessageKey.JoinMoreNames]: {
    [Language.German]: "+{count} weitere",
    [Language.English]: "+{count} more",
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
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
