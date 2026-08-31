"use client";

import { useEffect, useState } from "react";
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

const finalWinnerHoldMilliseconds = 12_000;

function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useFinalWinnerInterlude(isConcluded: boolean): boolean {
  const [wasConcluded, setWasConcluded] = useState(isConcluded);
  const [isInterludeActive, setIsInterludeActive] = useState(false);

  if (isConcluded !== wasConcluded) {
    setWasConcluded(isConcluded);

    if (isConcluded && !prefersReducedMotion()) {
      setIsInterludeActive(true);
    }
  }

  useEffect(() => {
    if (!isInterludeActive) {
      return undefined;
    }

    const timer = setTimeout(
      () => setIsInterludeActive(false),
      finalWinnerHoldMilliseconds,
    );

    return () => clearTimeout(timer);
  }, [isInterludeActive]);

  return isConcluded && isInterludeActive;
}

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
  const isRevealingFinalWinner = useFinalWinnerInterlude(isConcluded);

  if (isConcluded && !isRevealingFinalWinner) {
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
