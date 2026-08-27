import type { Single } from "../../../shared/reactiveTypes";
import type { IntentResult } from "../../intentResult";

export interface FinalVote {
  valueId: string;
  voteCount: number;
}

export interface ParticipantVotingPort {
  submitFinalVotes(votes: readonly FinalVote[]): Single<IntentResult>;
}
