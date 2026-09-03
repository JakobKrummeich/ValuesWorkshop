"use client";

import { PhaseView } from "../PhaseView";
import { usePresenterDependencies } from "./dependencies";
import { presenterPhaseView } from "./phases/phaseView";
import { PresenterShell } from "./PresenterShell";
import { useWallLanguage } from "./useWallLanguage";

export default function PresenterHome() {
  const { sessionStatePort } = usePresenterDependencies();
  useWallLanguage();

  return (
    <PresenterShell sessionStatePort={sessionStatePort}>
      <PhaseView
        sessionStatePort={sessionStatePort}
        components={presenterPhaseView}
      />
    </PresenterShell>
  );
}
