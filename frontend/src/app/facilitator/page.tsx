"use client";

import { PhaseView } from "../PhaseView";
import { useFacilitatorDependencies } from "./dependencies";
import { FacilitatorShell } from "./FacilitatorShell";
import { facilitatorPhaseView } from "./phases/phaseView";

export default function FacilitatorHome() {
  const { sessionStatePort } = useFacilitatorDependencies();

  return (
    <FacilitatorShell sessionStatePort={sessionStatePort}>
      <PhaseView
        sessionStatePort={sessionStatePort}
        components={facilitatorPhaseView}
      />
    </FacilitatorShell>
  );
}
