import type { z } from "zod";
import { Phase } from "../phases";
import { readStateFixtures } from "../../testing/wireContract";
import {
  facilitatorWorkshopStateSchema,
  participantWorkshopStateSchema,
  presenterWorkshopStateSchema,
} from "../workshopStateSchemas";

// WHY: a state block whose shape drifts is dropped silently — createSessionStatePort
// logs to the console and keeps the last state that parsed, so the screen freezes
// mid-workshop with the evidence in a console nobody watches. The fixtures under
// contract/state are the backend's serialized truth for every role and phase
// (produced by backend/Adapters.Tests/WireStateContractTests.cs); parsing them
// here turns that silent drop into a failing test.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md (step 6).
const schemaOfRole = {
  participant: participantWorkshopStateSchema,
  facilitator: facilitatorWorkshopStateSchema,
  presenter: presenterWorkshopStateSchema,
} satisfies Record<string, z.ZodType<{ phase: Phase }>>;

const roles = Object.keys(schemaOfRole) as (keyof typeof schemaOfRole)[];

describe.each(roles)("the %s wire state", (role) => {
  const fixtures = readStateFixtures(role);

  it.each(fixtures)(
    "parses the $name sample the backend serializes",
    ({ state }) => {
      expect(() => schemaOfRole[role].parse(state)).not.toThrow();
    },
  );

  it("covers every phase of the workshop", () => {
    const phasesCovered = fixtures.map(
      ({ state }) => schemaOfRole[role].parse(state).phase,
    );

    expect(new Set(phasesCovered)).toEqual(
      new Set(
        Object.values(Phase).filter((phase) => typeof phase === "number"),
      ),
    );
  });
});
