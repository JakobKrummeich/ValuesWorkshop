import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const finalVotingMessages = {
  [MessageKey.FinalVotingVotesUsed]: {
    [Language.German]: "Deine Stimmen: {used}/{total} vergeben",
    [Language.English]: "Your votes: {used}/{total} used",
  },
  [MessageKey.FinalVotingYourVotes]: {
    [Language.German]: "Deine Stimmen",
    [Language.English]: "Your votes",
  },
  [MessageKey.FinalVotingVotesLeft]: {
    [Language.German]: "Noch {count} Stimmen",
    [Language.English]: "{count} votes left",
  },
  [MessageKey.FinalVotingVoteLeftSingle]: {
    [Language.German]: "Noch 1 Stimme",
    [Language.English]: "1 vote left",
  },
  [MessageKey.FinalVotingAddVote]: {
    [Language.German]: "Stimme für {value} hinzufügen",
    [Language.English]: "Add a vote for {value}",
  },
  [MessageKey.FinalVotingRemoveVote]: {
    [Language.German]: "Stimme für {value} entfernen",
    [Language.English]: "Remove a vote for {value}",
  },
  [MessageKey.FinalVotingSubmit]: {
    [Language.German]: "{total} Stimmen abgeben",
    [Language.English]: "Submit {total} votes",
  },
  [MessageKey.FinalVotingSubmitSingle]: {
    [Language.German]: "1 Stimme abgeben",
    [Language.English]: "Submit 1 vote",
  },
  [MessageKey.FinalVotingSubmittedHeading]: {
    [Language.German]: "Stimmen erfolgreich abgegeben",
    [Language.English]: "Votes submitted successfully",
  },
  [MessageKey.FinalVotingSubmittedBody]: {
    [Language.German]: "Deine Stimmen sind gezählt — geheim und anonym.",
    [Language.English]: "Your votes are counted — secret and anonymous.",
  },
  [MessageKey.FinalVotingRoundVoted]: {
    [Language.German]: "Runde {round} · abgestimmt: {voted}/{total}",
    [Language.English]: "Round {round} · voted: {voted}/{total}",
  },
  [MessageKey.FinalVotingCloseVoting]: {
    [Language.German]: "Abstimmung schließen",
    [Language.English]: "Close voting",
  },
  [MessageKey.FinalVotingLastRoundResults]: {
    [Language.German]: "Ergebnis der letzten Runde",
    [Language.English]: "Last round's results",
  },
  [MessageKey.FinalVotingVoteCount]: {
    [Language.German]: "{count} Stimmen",
    [Language.English]: "{count} votes",
  },
  [MessageKey.FinalVotingTie]: {
    [Language.German]: "Gleichstand: {values} ({count} Stimmen)",
    [Language.English]: "Tie: {values} ({count} votes)",
  },
  [MessageKey.FinalVotingStartTiebreak]: {
    [Language.German]: "Stichwahl starten",
    [Language.English]: "Start tiebreak",
  },
  [MessageKey.FinalVotingOngoingHeading]: {
    [Language.German]: "Abstimmung läuft …",
    [Language.English]: "Voting ongoing…",
  },
  [MessageKey.FinalVotingOngoingBody]: {
    [Language.German]: "Stimmt auf euren Handys ab — geheim & anonym",
    [Language.English]: "Cast your votes on your phone — secret & anonymous",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
