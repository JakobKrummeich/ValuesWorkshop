"use client";

import { useParticipantGateway } from "./ports";

export default function ParticipantHome() {
  const gateway = useParticipantGateway();
  return (
    <main>
      <h1>Participant</h1>
      <p>Session: {gateway.sessionIdentity()}</p>
    </main>
  );
}
