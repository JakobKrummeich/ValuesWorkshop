"use client";

import { SessionStatusBanner } from "../SessionStatusBanner";
import { AdvancePhaseButton } from "./AdvancePhaseButton";
import { useFacilitatorDependencies } from "./dependencies";

export default function FacilitatorHome() {
  const { sessionState } = useFacilitatorDependencies();

  return (
    <main>
      <h1>Facilitator</h1>
      <SessionStatusBanner sessionState={sessionState} />
      <AdvancePhaseButton />
    </main>
  );
}
