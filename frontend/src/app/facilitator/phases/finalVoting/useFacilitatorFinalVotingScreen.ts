"use client";

import { useCallback } from "react";
import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { MessageKey } from "../../../../domain/i18n/messages";
import { voteCountMessageKeyOf } from "../../../../domain/i18n/voteCountMessageKey";
import {
  FacilitatorIntent,
  type FacilitatorFinalVotingState,
  type FacilitatorVotingView,
} from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useFacilitatorDependencies } from "../../dependencies";

export interface TallyRow {
  valueId: string;
  text: LocalizedText;
  voteCount: number;
  voteCountKey: MessageKey;
  share: number;
}

export interface TieCallout {
  values: LocalizedText[];
  voteCount: number;
  voteCountKey: MessageKey;
}

export interface FacilitatorFinalVotingScreenModel {
  roundNumber: number;
  votedCount: number;
  participantCount: number;
  votedFraction: number;
  isRoundOpen: boolean;
  isCloseVotingEnabled: boolean;
  isStartTiebreakEnabled: boolean;
  tallies: TallyRow[] | null;
  tie: TieCallout | null;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
  closeVoting: () => void;
  startTiebreakRound: () => void;
}

function valueTextOf(voting: FacilitatorVotingView, valueId: string) {
  return (
    voting.eligibleValues.find((value) => value.valueId === valueId)?.text ?? {
      de: valueId,
      en: valueId,
    }
  );
}

function talliesOf(voting: FacilitatorVotingView): TallyRow[] | null {
  const closedRoundTallies = voting.closedRoundTallies;
  if (closedRoundTallies === undefined) {
    return null;
  }

  const presentationOrder = voting.eligibleValues.map((value) => value.valueId);
  const topVoteCount = Math.max(0, ...Object.values(closedRoundTallies));
  return Object.entries(closedRoundTallies)
    .map(([valueId, voteCount]) => ({
      valueId,
      text: valueTextOf(voting, valueId),
      voteCount,
      voteCountKey: voteCountMessageKeyOf(voteCount),
      share: fractionOf(voteCount, topVoteCount),
    }))
    .sort(
      (left, right) =>
        right.voteCount - left.voteCount ||
        presentationOrder.indexOf(left.valueId) -
          presentationOrder.indexOf(right.valueId),
    );
}

function fractionOf(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

function tieOf(voting: FacilitatorVotingView): TieCallout | null {
  if (voting.tiedValueIds === undefined) {
    return null;
  }

  const voteCount = voting.closedRoundTallies?.[voting.tiedValueIds[0]] ?? 0;
  return {
    values: voting.tiedValueIds.map((valueId) => valueTextOf(voting, valueId)),
    voteCount,
    voteCountKey: voteCountMessageKeyOf(voteCount),
  };
}

export function useFacilitatorFinalVotingScreen(
  state: FacilitatorFinalVotingState,
): FacilitatorFinalVotingScreenModel {
  const { votingControlPort } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

  const closeVoting = useCallback(() => {
    sendIntent(votingControlPort.closeVoting());
  }, [votingControlPort, sendIntent]);

  const startTiebreakRound = useCallback(() => {
    sendIntent(votingControlPort.startTiebreakRound());
  }, [votingControlPort, sendIntent]);

  return {
    roundNumber: state.voting.roundNumber,
    votedCount: state.voting.votedCount,
    participantCount: state.voting.participantCount,
    votedFraction: fractionOf(
      state.voting.votedCount,
      state.voting.participantCount,
    ),
    isRoundOpen: state.voting.isRoundOpen,
    isCloseVotingEnabled: state.enabledIntents.includes(
      FacilitatorIntent.CloseVoting,
    ),
    isStartTiebreakEnabled: state.enabledIntents.includes(
      FacilitatorIntent.StartTiebreakRound,
    ),
    tallies: talliesOf(state.voting),
    tie: tieOf(state.voting),
    isSending,
    rejectionMessage,
    closeVoting,
    startTiebreakRound,
  };
}
