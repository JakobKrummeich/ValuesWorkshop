import { IntentRejectionCode } from "../intentResult";
import { Phase } from "../phases";
import {
  FacilitatorIntent,
  FormationSubState,
  GroupWorkStatus,
  QuizSubState,
} from "../workshopState";
import { readEnumCatalog } from "../../testing/wireContract";

// WHY: every wire enum is declared twice, and the two declarations only agree by
// hand. The wire form differs per enum — Phase travels as a number,
// GroupWorkStatus as "editing" — so mirroring the C# source is not enough:
// contract/enums.json records what the SignalR serializer actually emits
// (produced by backend/Adapters.Tests/WireEnumContractTests.cs).
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md (step 4).
const catalog = readEnumCatalog();

const mirroredEnums: Record<string, Record<string, string | number>> = {
  Phase,
  IntentRejectionCode,
  FacilitatorIntent,
  QuizSubState,
  GroupWorkStatus,
  FormationSubState,
};

// WHY: TypeScript gives numeric enums a reverse mapping (1 -> "Join"), which is
// a language artefact and never crosses the wire.
function membersOf(
  mirrored: Record<string, string | number>,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(mirrored).filter(([member]) => Number.isNaN(Number(member))),
  );
}

describe("the wire enums", () => {
  it.each(Object.keys(mirroredEnums))(
    "%s carries the values the backend serializes",
    (name) => {
      expect(membersOf(mirroredEnums[name])).toEqual(catalog[name]);
    },
  );

  it("mirrors every enum the backend puts on the wire", () => {
    expect(Object.keys(mirroredEnums).sort()).toEqual(
      Object.keys(catalog).sort(),
    );
  });
});
