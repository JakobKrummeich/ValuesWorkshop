"use client";

import { currentSessionIdentity } from "../../adapters/browserLocation";
import { MessageKey } from "../../domain/i18n/messages";
import { phaseNameKey } from "../../domain/i18n/phaseNameKey";
import type { Phase } from "../../domain/phases";
import type { FacilitatorSessionStatePort } from "../../domain/ports/facilitator/sessionStatePort";
import { useTranslation } from "../i18n/useTranslation";
import { usePhaseView } from "../usePhaseView";

const sessionCodeLength = 8;

export interface FacilitatorShellResult {
  phase: Phase | null;
  heading: string;
  title: string;
  sessionCodeLabel: string;
  sessionCode: string | null;
  participantsLabel: string;
  participantCount: string;
}

export function useFacilitatorShell(
  sessionStatePort: FacilitatorSessionStatePort,
): FacilitatorShellResult {
  const state = usePhaseView(sessionStatePort);
  const phase = state?.phase ?? null;
  const { translate } = useTranslation();
  const sessionIdentity = currentSessionIdentity();

  return {
    phase,
    heading: translate(MessageKey.FacilitatorHeading),
    title:
      phase === null
        ? translate(MessageKey.SessionWaiting)
        : translate(phaseNameKey(phase)),
    sessionCodeLabel: translate(MessageKey.SessionCodeLabel),
    sessionCode:
      sessionIdentity === null
        ? null
        : sessionIdentity.slice(0, sessionCodeLength),
    participantsLabel: translate(MessageKey.SessionParticipantsLabel),
    participantCount:
      state === null ? "–" : String(state.roster.participantCount),
  };
}
