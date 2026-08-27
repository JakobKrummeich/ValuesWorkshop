"use client";

import { useCallback, useMemo, useState } from "react";
import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantVotingView } from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useParticipantDependencies } from "../../dependencies";

export interface VoteCardModel {
  valueId: string;
  text: LocalizedText;
  actions: readonly string[];
  voteCount: number;
  canAdd: boolean;
  canRemove: boolean;
}

export interface ParticipantFinalVotingScreenModel {
  showConfirmation: boolean;
  cards: VoteCardModel[];
  usedVotes: number;
  allotment: number;
  canSubmit: boolean;
  addVote: (valueId: string) => void;
  removeVote: (valueId: string) => void;
  submitVotes: () => void;
  rejectionMessage: MessageKey | null;
}

interface Ballot {
  roundNumber: number;
  voteCounts: Readonly<Record<string, number>>;
}

function totalOf(voteCounts: Readonly<Record<string, number>>): number {
  return Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
}

export function useParticipantFinalVotingScreen(
  voting: ParticipantVotingView,
): ParticipantFinalVotingScreenModel {
  const { votingPort } = useParticipantDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const [ballot, setBallot] = useState<Ballot>({
    roundNumber: voting.roundNumber,
    voteCounts: {},
  });

  const { roundNumber, allotment } = voting;
  const voteCounts = useMemo(
    () => (ballot.roundNumber === roundNumber ? ballot.voteCounts : {}),
    [ballot, roundNumber],
  );
  const usedVotes = totalOf(voteCounts);
  const canVote = !isSending && voting.isRoundOpen && !voting.hasVotedThisRound;
  const canSubmit = canVote && usedVotes === allotment;

  const addVote = useCallback(
    (valueId: string) => {
      setBallot((current) => {
        const counts =
          current.roundNumber === roundNumber ? current.voteCounts : {};
        if (totalOf(counts) >= allotment) {
          return current;
        }
        return {
          roundNumber,
          voteCounts: { ...counts, [valueId]: (counts[valueId] ?? 0) + 1 },
        };
      });
    },
    [roundNumber, allotment],
  );

  const removeVote = useCallback(
    (valueId: string) => {
      setBallot((current) => {
        const counts =
          current.roundNumber === roundNumber ? current.voteCounts : {};
        const count = counts[valueId] ?? 0;
        if (count === 0) {
          return current;
        }
        return {
          roundNumber,
          voteCounts: { ...counts, [valueId]: count - 1 },
        };
      });
    },
    [roundNumber],
  );

  const submitVotes = useCallback(() => {
    if (!canSubmit) {
      return;
    }
    const votes = Object.entries(voteCounts)
      .filter(([, voteCount]) => voteCount > 0)
      .map(([valueId, voteCount]) => ({ valueId, voteCount }));
    sendIntent(votingPort.submitFinalVotes(votes));
  }, [canSubmit, voteCounts, votingPort, sendIntent]);

  return {
    showConfirmation: voting.hasVotedThisRound || !voting.isRoundOpen,
    cards: voting.eligibleValues.map(({ valueId, text, actions }) => ({
      valueId,
      text,
      actions,
      voteCount: voteCounts[valueId] ?? 0,
      canAdd: canVote && usedVotes < allotment,
      canRemove: canVote && (voteCounts[valueId] ?? 0) > 0,
    })),
    usedVotes,
    allotment,
    canSubmit,
    addVote,
    removeVote,
    submitVotes,
    rejectionMessage,
  };
}
