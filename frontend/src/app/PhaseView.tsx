"use client";

import type { ComponentType } from "react";
import type { Phase } from "../domain/phases";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../domain/workshopState";
import { usePhaseView } from "./usePhaseView";

export type PhaseComponents<TState extends PhasedWorkshopState> = Readonly<{
  [TPhase in Phase]: ComponentType<{
    state: Extract<TState, { phase: TPhase }>;
  }>;
}>;

export function PhaseView<TState extends PhasedWorkshopState>({
  sessionState,
  components,
}: {
  sessionState: SessionStatePort<TState>;
  components: PhaseComponents<TState>;
}) {
  const state = usePhaseView(sessionState);

  if (state === null) {
    return null;
  }

  const CurrentPhase = components[state.phase] as ComponentType<{
    state: TState;
  }>;

  return <CurrentPhase state={state} />;
}
