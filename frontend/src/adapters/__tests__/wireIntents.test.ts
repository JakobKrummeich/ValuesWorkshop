import { NEVER, of } from "rxjs";
import {
  FacilitatorIntent,
  ParticipantIntent,
} from "../../domain/workshopState";
import { readIntentCatalog } from "../../testing/wireContract";
import { createFacilitatorConclusionControlPort } from "../facilitatorConclusionControlAdapter";
import { createFacilitatorGroupWorkControlPort } from "../facilitatorGroupWorkControlAdapter";
import { createFacilitatorLifecyclePort } from "../facilitatorLifecycleAdapter";
import { createFacilitatorQuizControlPort } from "../facilitatorQuizControlAdapter";
import { createFacilitatorVotingControlPort } from "../facilitatorVotingControlAdapter";
import { createFacilitatorWalkControlPort } from "../facilitatorWalkControlAdapter";
import { createParticipantGroupWorkPort } from "../participantGroupWorkAdapter";
import { createParticipantQuizPort } from "../participantQuizAdapter";
import { createParticipantSelectionPort } from "../participantSelectionAdapter";
import { createParticipantVotingPort } from "../participantVotingAdapter";
import type { WebsocketConnection } from "../websocketConnection";

// WHY: intents cross the wire as strings, so a renamed hub method or a dropped
// parameter reaches production unnoticed by tsc and by the C# compiler alike —
// PR #42 needed three hand repairs for exactly that. contract/intents.json is
// the backend's own account of its hubs, produced by
// backend/Adapters.Tests/WireContractTests.cs; every call the ports below can
// make is checked against it, so drift fails here instead of in a workshop.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md.
const catalog = readIntentCatalog();

type Role = "facilitator" | "participant";

const portFactoriesOfRole: Record<
  Role,
  ((connection: WebsocketConnection) => object)[]
> = {
  facilitator: [
    createFacilitatorConclusionControlPort,
    createFacilitatorGroupWorkControlPort,
    createFacilitatorLifecyclePort,
    createFacilitatorQuizControlPort,
    createFacilitatorVotingControlPort,
    createFacilitatorWalkControlPort,
  ],
  participant: [
    createParticipantGroupWorkPort,
    createParticipantQuizPort,
    createParticipantSelectionPort,
    createParticipantVotingPort,
  ],
};

const intentEnumOfRole: Record<Role, Record<string, string>> = {
  facilitator: FacilitatorIntent,
  participant: ParticipantIntent,
};

const roles = Object.keys(portFactoriesOfRole) as Role[];

function recordingConnection(): {
  connection: WebsocketConnection;
  invoke: jest.Mock;
} {
  const invoke = jest.fn(() =>
    of({ isAccepted: true, code: null, detail: null }),
  );

  return {
    connection: {
      connectionState: NEVER,
      start: NEVER,
      stop: NEVER,
      on: () => NEVER,
      invoke,
    },
    invoke,
  };
}

function callsMadeByEveryPortMethod(role: Role): {
  role: Role;
  methodName: string;
  calls: [string, ...unknown[]][];
}[] {
  return portFactoriesOfRole[role].flatMap((createPort) => {
    const { connection, invoke } = recordingConnection();

    return Object.entries(createPort(connection))
      .filter(([, member]) => typeof member === "function")
      .map(
        ([methodName, method]: [string, (...args: unknown[]) => unknown]) => {
          invoke.mockClear();
          method(...new Array<string>(method.length).fill("placeholder"));

          return {
            role,
            methodName,
            calls: [...invoke.mock.calls] as [string, ...unknown[]][],
          };
        },
      );
  });
}

const portMethods = roles.flatMap(callsMadeByEveryPortMethod);

describe("the intents the frontend sends", () => {
  it.each(portMethods)(
    "$role port method $methodName invokes an intent its hub declares",
    ({ role, calls }) => {
      expect(calls).toHaveLength(1);

      const [intentName, ...payload] = calls[0];
      const declaredIntents = catalog[role];

      expect(Object.keys(declaredIntents)).toContain(intentName);
      expect(payload).toHaveLength(declaredIntents[intentName].length);
    },
  );

  it.each(roles)("every %s intent constant names a hub method", (role) => {
    expect(Object.keys(catalog[role])).toEqual(
      expect.arrayContaining(Object.values(intentEnumOfRole[role])),
    );
  });

  // WHY: the port factories are a hand-kept list, so without this the suite would
  // quietly stop covering an adapter nobody remembered to register here.
  it.each(roles)("every %s intent constant is sent by a port", (role) => {
    const intentsSent = portMethods
      .filter((portMethod) => portMethod.role === role)
      .map((portMethod) => portMethod.calls[0][0]);

    expect(new Set(intentsSent)).toEqual(
      new Set(Object.values(intentEnumOfRole[role])),
    );
  });
});
