"use client";

import { useTranslation } from "../i18n/useTranslation";
import { usePhaseView } from "../usePhaseView";
import { advanceGuardMessageOf } from "./advanceGuard";
import { useFacilitatorDependencies } from "./dependencies";

export interface AdvanceGuardResult {
  guardText: string | null;
}

export function useAdvanceGuard(): AdvanceGuardResult {
  const { sessionStatePort } = useFacilitatorDependencies();
  const state = usePhaseView(sessionStatePort);
  const { translate } = useTranslation();
  const guardMessage = state === null ? null : advanceGuardMessageOf(state);

  return {
    guardText: guardMessage === null ? null : translate(guardMessage),
  };
}
