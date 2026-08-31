"use client";

import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type {
  PresenterFinalPresentationState,
  WinnerWithActions,
} from "../../../../domain/workshopState";

export enum FinalPresentationStage {
  Anticipation = "anticipation",
  Reveal = "reveal",
  Overview = "overview",
}

export interface RevealedWinnerModel {
  valueId: string;
  text: LocalizedText;
  place: number;
  voteCount: number;
  voteCountKey: MessageKey;
  actions: string[];
}

export type PresenterFinalPresentationModel =
  | { stage: FinalPresentationStage.Anticipation }
  | { stage: FinalPresentationStage.Reveal; winner: RevealedWinnerModel }
  | { stage: FinalPresentationStage.Overview; winners: RevealedWinnerModel[] };

function revealedWinnerModelOf(winner: WinnerWithActions): RevealedWinnerModel {
  return {
    ...winner,
    voteCountKey:
      winner.voteCount === 1
        ? MessageKey.FinalPresentationVoteCountSingle
        : MessageKey.FinalPresentationVoteCount,
  };
}

export function usePresenterFinalPresentationScreen(
  state: PresenterFinalPresentationState,
): PresenterFinalPresentationModel {
  const { revealedWinners, isConcluded } = state.conclusion;

  if (isConcluded) {
    return {
      stage: FinalPresentationStage.Overview,
      winners: revealedWinners
        .map(revealedWinnerModelOf)
        .sort((left, right) => left.place - right.place),
    };
  }

  if (revealedWinners.length === 0) {
    return { stage: FinalPresentationStage.Anticipation };
  }

  return {
    stage: FinalPresentationStage.Reveal,
    winner: revealedWinnerModelOf(revealedWinners[revealedWinners.length - 1]),
  };
}
