"use client";

import { SessionStatusBanner } from "../SessionStatusBanner";
import { useParticipantDependencies } from "./dependencies";

export default function ParticipantHome() {
  const { sessionState } = useParticipantDependencies();

  return (
    <main>
      <h1>Participant</h1>
      <SessionStatusBanner sessionState={sessionState} />
    </main>
  );
}
