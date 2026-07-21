"use client";

import { useParticipantDependencies } from "./dependencies";

export default function ParticipantHome() {
  const { gateway } = useParticipantDependencies();
  return (
    <main>
      <h1>Participant</h1>
      <p>Session: {gateway.sessionIdentity()}</p>
    </main>
  );
}
