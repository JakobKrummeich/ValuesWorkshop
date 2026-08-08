"use client";

import { participantJoinUrl } from "../../../../adapters/browserLocation";

export interface PresenterJoinScreenResult {
  joinUrl: string | null;
}

export function usePresenterJoinScreen(): PresenterJoinScreenResult {
  return { joinUrl: participantJoinUrl() };
}
