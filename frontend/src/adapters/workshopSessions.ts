import type { FacilitatorGroupWorkControlPort } from "../domain/ports/facilitator/groupWorkControlPort";
import type { FacilitatorWalkControlPort } from "../domain/ports/facilitator/walkControlPort";
import type { FacilitatorLifecyclePort } from "../domain/ports/facilitator/lifecyclePort";
import type { FacilitatorQuizControlPort } from "../domain/ports/facilitator/quizControlPort";
import type { ParticipantGroupWorkPort } from "../domain/ports/participant/groupWorkPort";
import type { ParticipantQuizPort } from "../domain/ports/participant/quizPort";
import type { ParticipantSelectionPort } from "../domain/ports/participant/selectionPort";
import type { FacilitatorSessionStatePort } from "../domain/ports/facilitator/sessionStatePort";
import type { ParticipantSessionStatePort } from "../domain/ports/participant/sessionStatePort";
import type { PresenterSessionStatePort } from "../domain/ports/presenter/sessionStatePort";
import {
  facilitatorWorkshopStateSchema,
  participantWorkshopStateSchema,
  presenterWorkshopStateSchema,
} from "../domain/workshopState";
import { WorkshopRole } from "../domain/workshopRole";
import { hubBaseUrl } from "../config/environment";
import type { Completable, Single } from "../shared/reactiveTypes";
import { getAccessToken } from "./authAdapter";
import { createFacilitatorGroupWorkControlPort } from "./facilitatorGroupWorkControlAdapter";
import { createFacilitatorWalkControlPort } from "./facilitatorWalkControlAdapter";
import { createFacilitatorLifecyclePort } from "./facilitatorLifecycleAdapter";
import { createFacilitatorQuizControlPort } from "./facilitatorQuizControlAdapter";
import { createParticipantGroupWorkPort } from "./participantGroupWorkAdapter";
import { createParticipantQuizPort } from "./participantQuizAdapter";
import { createParticipantSelectionPort } from "./participantSelectionAdapter";
import { withSerializedLifecycle } from "./serializedLifecycle";
import { createSessionStatePort } from "./sessionStateAdapter";
import { createSignalRConnection } from "./signalRConnection";
import type { WebsocketConnection } from "./websocketConnection";

export interface WorkshopSession {
  readonly start: Completable;
  readonly close: Completable;
}

export interface ParticipantSession extends WorkshopSession {
  readonly sessionStatePort: ParticipantSessionStatePort;
  readonly quizPort: ParticipantQuizPort;
  readonly selectionPort: ParticipantSelectionPort;
  readonly groupWorkPort: ParticipantGroupWorkPort;
}

export interface FacilitatorSession extends WorkshopSession {
  readonly sessionStatePort: FacilitatorSessionStatePort;
  readonly lifecyclePort: FacilitatorLifecyclePort;
  readonly quizControlPort: FacilitatorQuizControlPort;
  readonly groupWorkControlPort: FacilitatorGroupWorkControlPort;
  readonly walkControlPort: FacilitatorWalkControlPort;
}

export interface PresenterSession extends WorkshopSession {
  readonly sessionStatePort: PresenterSessionStatePort;
}

export function createParticipantSession(
  sessionIdentity: string,
): ParticipantSession {
  const connection = connectAuthenticated(
    WorkshopRole.Participant,
    sessionIdentity,
  );

  return {
    sessionStatePort: createSessionStatePort(
      connection,
      participantWorkshopStateSchema,
    ),
    quizPort: createParticipantQuizPort(connection),
    selectionPort: createParticipantSelectionPort(connection),
    groupWorkPort: createParticipantGroupWorkPort(connection),
    ...lifetimeOf(connection),
  };
}

export function createFacilitatorSession(
  sessionIdentity: string,
): FacilitatorSession {
  const connection = connectAuthenticated(
    WorkshopRole.Facilitator,
    sessionIdentity,
  );

  return {
    sessionStatePort: createSessionStatePort(
      connection,
      facilitatorWorkshopStateSchema,
    ),
    lifecyclePort: createFacilitatorLifecyclePort(connection),
    quizControlPort: createFacilitatorQuizControlPort(connection),
    groupWorkControlPort: createFacilitatorGroupWorkControlPort(connection),
    walkControlPort: createFacilitatorWalkControlPort(connection),
    ...lifetimeOf(connection),
  };
}

export function createPresenterSession(
  sessionIdentity: string,
): PresenterSession {
  const connection = connect(WorkshopRole.Presenter, sessionIdentity);

  return {
    sessionStatePort: createSessionStatePort(
      connection,
      presenterWorkshopStateSchema,
    ),
    ...lifetimeOf(connection),
  };
}

function connectAuthenticated(
  role: WorkshopRole,
  sessionIdentity: string,
): WebsocketConnection {
  return connect(role, sessionIdentity, getAccessToken());
}

function connect(
  role: WorkshopRole,
  sessionIdentity: string,
  accessToken?: Single<string>,
): WebsocketConnection {
  return withSerializedLifecycle(
    createSignalRConnection({
      url: hubUrl(role, sessionIdentity),
      accessToken,
    }),
  );
}

function lifetimeOf(connection: WebsocketConnection): WorkshopSession {
  return { start: connection.start, close: connection.stop };
}

function hubUrl(role: WorkshopRole, sessionIdentity: string): string {
  return `${hubBaseUrl()}/hub/${role}?sessionIdentity=${encodeURIComponent(sessionIdentity)}`;
}
