"use client";

import type { Phase } from "../../domain/phases";
import type { SessionStatePort } from "../../domain/ports/sessionStatePort";
import type { PhasedWorkshopState } from "../../domain/workshopState";
import { usePhaseView } from "../usePhaseView";

export function usePhaseStatus(
  sessionStatePort: SessionStatePort<PhasedWorkshopState>,
): Phase | null {
  return usePhaseView(sessionStatePort)?.phase ?? null;
}
