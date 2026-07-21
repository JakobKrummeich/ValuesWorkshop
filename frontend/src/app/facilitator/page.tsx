"use client";

import { useFacilitatorGateway } from "./ports";

export default function FacilitatorHome() {
  const gateway = useFacilitatorGateway();
  return (
    <main>
      <h1>Facilitator</h1>
      <p>Session: {gateway.sessionIdentity()}</p>
    </main>
  );
}
