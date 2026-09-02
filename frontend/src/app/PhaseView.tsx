"use client";

import type { ComponentType } from "react";
import type { Phase } from "../domain/phases";
import type { SessionStatePort } from "../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../domain/workshopState";
import styles from "./PhaseView.module.css";
import { usePhaseView } from "./usePhaseView";

export type PhaseComponents<TState extends PhasedWorkshopState> = Readonly<{
  [TPhase in Phase]: ComponentType<{
    state: Extract<TState, { phase: TPhase }>;
  }>;
}>;

export function PhaseView<TState extends PhasedWorkshopState>({
  sessionStatePort,
  components,
}: {
  sessionStatePort: SessionStatePort<TState>;
  components: PhaseComponents<TState>;
}) {
  const state = usePhaseView(sessionStatePort);

  if (state === null) {
    return null;
  }

  const CurrentPhase = components[state.phase] as ComponentType<{
    state: TState;
  }>;

  return (
    <div key={state.phase} className={styles.phase}>
      <CurrentPhase state={state} />
    </div>
  );
}
