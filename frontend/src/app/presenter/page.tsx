"use client";

import { usePresenterGateway } from "./ports";

export default function PresenterHome() {
  const gateway = usePresenterGateway();
  return (
    <main>
      <h1>Presenter</h1>
      <p>Session: {gateway.sessionIdentity()}</p>
    </main>
  );
}
