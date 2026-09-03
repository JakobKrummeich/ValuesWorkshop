"use client";

import { PhaseView } from "../PhaseView";
import { useParticipantDependencies } from "./dependencies";
import { ParticipantShell } from "./ParticipantShell";
import { participantPhaseView } from "./phases/phaseView";

export default function ParticipantHome() {
  const { sessionStatePort } = useParticipantDependencies();

  return (
    <ParticipantShell sessionStatePort={sessionStatePort}>
      <PhaseView
        sessionStatePort={sessionStatePort}
        components={participantPhaseView}
      />
    </ParticipantShell>
  );
}
