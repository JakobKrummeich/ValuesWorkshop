import { firstValueFrom } from "rxjs";
import type { FacilitatorLifecyclePort } from "../domain/ports/facilitator/lifecyclePort";
import type { FacilitatorSessionStatePort } from "../domain/ports/facilitator/sessionStatePort";
import type { ParticipantSessionStatePort } from "../domain/ports/participant/sessionStatePort";
import type { PresenterSessionStatePort } from "../domain/ports/presenter/sessionStatePort";
import {
  facilitatorWorkshopStateSchema,
  participantWorkshopStateSchema,
  presenterWorkshopStateSchema,
} from "../domain/workshopState";
import type { Completable } from "../shared/reactiveTypes";
import { getAccessToken } from "./authAdapter";
import { createFacilitatorLifecyclePort } from "./facilitatorLifecycleAdapter";
import { createSessionStatePort } from "./sessionStateAdapter";
import {
  createSignalRConnection,
  type SignalRConnection,
} from "./signalRConnection";

export interface WorkshopSession {
  start(): Completable;
  close(): Completable;
}

export interface ParticipantSession extends WorkshopSession {
  readonly sessionState: ParticipantSessionStatePort;
}

export interface FacilitatorSession extends WorkshopSession {
  readonly sessionState: FacilitatorSessionStatePort;
  readonly lifecycle: FacilitatorLifecyclePort;
}

export interface PresenterSession extends WorkshopSession {
  readonly sessionState: PresenterSessionStatePort;
}

export function createParticipantSession(
  sessionIdentity: string,
): ParticipantSession {
  const connection = connectAuthenticated("participant", sessionIdentity);

  return {
    sessionState: createSessionStatePort(
      connection,
      participantWorkshopStateSchema,
    ),
    ...lifetimeOf(connection),
  };
}

export function createFacilitatorSession(
  sessionIdentity: string,
): FacilitatorSession {
  const connection = connectAuthenticated("facilitator", sessionIdentity);

  return {
    sessionState: createSessionStatePort(
      connection,
      facilitatorWorkshopStateSchema,
    ),
    lifecycle: createFacilitatorLifecyclePort(connection),
    ...lifetimeOf(connection),
  };
}

export function createPresenterSession(
  sessionIdentity: string,
): PresenterSession {
  const connection = createSignalRConnection({
    url: hubUrl("presenter", sessionIdentity),
  });

  return {
    sessionState: createSessionStatePort(
      connection,
      presenterWorkshopStateSchema,
    ),
    ...lifetimeOf(connection),
  };
}

function connectAuthenticated(
  role: string,
  sessionIdentity: string,
): SignalRConnection {
  return createSignalRConnection({
    url: hubUrl(role, sessionIdentity),
    accessTokenFactory: () => firstValueFrom(getAccessToken()),
  });
}

function lifetimeOf(connection: SignalRConnection): WorkshopSession {
  return { start: connection.start, close: connection.stop };
}

function hubUrl(role: string, sessionIdentity: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_HUB_BASE_URL ?? "http://localhost:5000";

  return `${baseUrl}/hub/${role}?sessionIdentity=${encodeURIComponent(sessionIdentity)}`;
}
