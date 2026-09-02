"use client";

import type { ParticipantValuePresentationState } from "../../../../domain/workshopState";
import { WaitingScreen } from "../../../WaitingScreen";
import { useParticipantValuePresentationScreen } from "./useParticipantValuePresentationScreen";

export function ParticipantValuePresentationScreen({
  state,
}: {
  state: ParticipantValuePresentationState;
}) {
  const copy = useParticipantValuePresentationScreen(state);

  return <WaitingScreen {...copy} />;
}
