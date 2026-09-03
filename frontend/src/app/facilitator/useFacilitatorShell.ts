"use client";

import { MessageKey } from "../../domain/i18n/messages";
import { phaseNameKey } from "../../domain/i18n/phaseNameKey";
import type { Phase } from "../../domain/phases";
import type { FacilitatorSessionStatePort } from "../../domain/ports/facilitator/sessionStatePort";
import { useTranslation } from "../i18n/useTranslation";
import { usePhaseView } from "../usePhaseView";

export interface FacilitatorShellResult {
  phase: Phase | null;
  heading: string;
  title: string;
  participantsLabel: string;
  participantCount: string;
}

export function useFacilitatorShell(
  sessionStatePort: FacilitatorSessionStatePort,
): FacilitatorShellResult {
  const state = usePhaseView(sessionStatePort);
  const phase = state?.phase ?? null;
  const { translate } = useTranslation();

  return {
    phase,
    heading: translate(MessageKey.FacilitatorHeading),
    title:
      phase === null
        ? translate(MessageKey.SessionWaiting)
        : translate(phaseNameKey(phase)),
    participantsLabel: translate(MessageKey.SessionParticipantsLabel),
    participantCount:
      state === null ? "–" : String(state.roster.participantCount),
  };
}
