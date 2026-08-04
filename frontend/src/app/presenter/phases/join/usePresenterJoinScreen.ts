"use client";

import { participantJoinUrl } from "../../../../adapters/browserLocation";
import type { PresenterJoinState } from "../../../../domain/workshopState";

export interface PresenterJoinScreenResult {
  joinUrl: string | null;
  displayNames: readonly string[];
  participantCount: number;
}

export function usePresenterJoinScreen(
  state: PresenterJoinState,
): PresenterJoinScreenResult {
  return {
    joinUrl: participantJoinUrl(),
    displayNames: state.participantDisplayNames,
    participantCount: state.participantCount,
  };
}
