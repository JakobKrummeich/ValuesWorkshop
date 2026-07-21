"use client";

import { usePresenterDependencies } from "./dependencies";

export default function PresenterHome() {
  const { gateway } = usePresenterDependencies();
  return (
    <main>
      <h1>Presenter</h1>
      <p>Session: {gateway.sessionIdentity()}</p>
    </main>
  );
}
