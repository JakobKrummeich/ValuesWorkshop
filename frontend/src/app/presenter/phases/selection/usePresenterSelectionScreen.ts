"use client";

import type { PresenterSelectionState } from "../../../../domain/workshopState";

export interface PresenterSelectionScreenModel {
  submittedCount: number;
  participantCount: number;
  progressFraction: number;
}

export function usePresenterSelectionScreen(
  state: PresenterSelectionState,
): PresenterSelectionScreenModel {
  const { submittedCount } = state.selection;
  const { participantCount } = state;

  return {
    submittedCount,
    participantCount,
    progressFraction:
      participantCount === 0
        ? 0
        : Math.min(1, submittedCount / participantCount),
  };
}
