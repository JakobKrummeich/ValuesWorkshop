"use client";

import type { PresenterFinalPresentationState } from "../../../../domain/workshopState";
import { RevealAnticipation } from "./RevealAnticipation";
import {
  FinalPresentationStage,
  usePresenterFinalPresentationScreen,
} from "./usePresenterFinalPresentationScreen";
import { WinnerOverview } from "./WinnerOverview";
import { WinnerReveal } from "./WinnerReveal";

export function PresenterFinalPresentationScreen({
  state,
}: {
  state: PresenterFinalPresentationState;
}) {
  const model = usePresenterFinalPresentationScreen(state);

  if (model.stage === FinalPresentationStage.Anticipation) {
    return <RevealAnticipation />;
  }

  if (model.stage === FinalPresentationStage.Reveal) {
    return <WinnerReveal key={model.winner.place} winner={model.winner} />;
  }

  return <WinnerOverview podium={model.podium} runnersUp={model.runnersUp} />;
}
