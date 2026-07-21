"use client";

import { useFacilitatorDependencies } from "./dependencies";

export default function FacilitatorHome() {
  const { gateway } = useFacilitatorDependencies();
  return (
    <main>
      <h1>Facilitator</h1>
      <p>Session: {gateway.sessionIdentity()}</p>
    </main>
  );
}
