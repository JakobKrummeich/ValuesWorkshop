"use client";

import { SessionStatusBanner } from "../SessionStatusBanner";
import { usePresenterDependencies } from "./dependencies";

export default function PresenterHome() {
  const { sessionState } = usePresenterDependencies();

  return (
    <main>
      <h1>Presenter</h1>
      <SessionStatusBanner sessionState={sessionState} />
    </main>
  );
}
