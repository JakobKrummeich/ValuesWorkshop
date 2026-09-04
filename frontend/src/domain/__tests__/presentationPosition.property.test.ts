import fc from "fast-check";
import {
  presentationPositionOf,
  PresentationPositionKind,
  type PresentingGroup,
} from "../presentationPosition";

const localizedText = (text: string) => ({
  de: `${text}-de`,
  en: `${text}-en`,
});

const groupsWithValues = fc
  .uniqueArray(fc.integer({ min: 1, max: 20 }), { minLength: 1, maxLength: 7 })
  .chain((animalNumbers) =>
    fc
      .uniqueArray(fc.integer({ min: 1, max: 50 }), {
        minLength: animalNumbers.length,
        maxLength: animalNumbers.length * 3,
      })
      .map((valueNumbers) =>
        animalNumbers.map((animalNumber, groupIndex) => ({
          name: {
            animalId: `animal-${animalNumber}`,
            text: localizedText(`animal-${animalNumber}`),
          },
          assignedValues: valueNumbers
            .filter(
              (unused, index) => index % animalNumbers.length === groupIndex,
            )
            .map((valueNumber) => ({
              valueId: `value-${valueNumber}`,
              text: localizedText(`value-${valueNumber}`),
            })),
        })),
      ),
  );

const walks = groupsWithValues.chain((groups) =>
  fc.record({
    groups: fc.constant(groups),
    presentingGroupName: fc.oneof(
      fc.constantFrom(...groups.map((group) => group.name.animalId)),
      fc.constant(null),
      fc.constant("animal-not-in-this-workshop"),
    ),
    presentedValueId: fc.oneof(
      fc.constantFrom(
        ...groups.flatMap((group) =>
          group.assignedValues.map((value) => value.valueId),
        ),
      ),
      fc.constant(null),
      fc.constant("value-not-in-this-workshop"),
    ),
  }),
);

function positionOf(walk: {
  groups: PresentingGroup[];
  presentingGroupName: string | null;
  presentedValueId: string | null;
}) {
  return presentationPositionOf<string>(walk.groups, {
    presentingGroupName: walk.presentingGroupName,
    presentedValueId: walk.presentedValueId,
    presentedActions: ["an action"],
  });
}

describe("the presentation position, for any walk", () => {
  it("stands on no position while no known group is presenting", () => {
    fc.assert(
      fc.property(walks, (walk) => {
        const isKnownGroup = walk.groups.some(
          (group) => group.name.animalId === walk.presentingGroupName,
        );

        expect(isKnownGroup || positionOf(walk) === null).toBe(true);
      }),
    );
  });

  it("stands on the group intro exactly while no value is presented", () => {
    fc.assert(
      fc.property(walks, (walk) => {
        const position = positionOf(walk);
        const isGroupIntro =
          position?.kind === PresentationPositionKind.GroupIntro;

        expect(isGroupIntro).toBe(
          position !== null && walk.presentedValueId === null,
        );
      }),
    );
  });

  it("only ever presents a value the presenting group was assigned", () => {
    fc.assert(
      fc.property(walks, (walk) => {
        const position = positionOf(walk);
        if (position?.kind !== PresentationPositionKind.PresentedValue) {
          return;
        }

        const presentingGroup = walk.groups.find(
          (group) => group.name.animalId === position.animalId,
        );

        expect(
          presentingGroup?.assignedValues.map((value) => value.valueId),
        ).toContain(position.valueId);
        expect(position.valueId).toBe(walk.presentedValueId);
        expect(position.actions).toEqual(["an action"]);
      }),
    );
  });

  it("names the presenting group on every position it stands on", () => {
    fc.assert(
      fc.property(walks, (walk) => {
        const position = positionOf(walk);
        if (position === null) {
          return;
        }

        expect(position.animalId).toBe(walk.presentingGroupName);
        expect(position.groupName).toEqual(localizedText(position.animalId));
      }),
    );
  });

  it("stands on no position when the presented value belongs to another group", () => {
    fc.assert(
      fc.property(walks, (walk) => {
        const presentingGroup = walk.groups.find(
          (group) => group.name.animalId === walk.presentingGroupName,
        );
        const isOwnValue = presentingGroup?.assignedValues.some(
          (value) => value.valueId === walk.presentedValueId,
        );
        if (presentingGroup === undefined || walk.presentedValueId === null) {
          return;
        }

        expect(positionOf(walk) === null).toBe(!isOwnValue);
      }),
    );
  });
});
