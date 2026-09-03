import { Phase } from "../../../domain/phases";
import {
  FormationSubState,
  GroupWorkStatus,
  type GroupName,
  type ParticipantWorkshopState,
} from "../../../domain/workshopState";
import { rememberOwnGroupName } from "../ownGroupMemory";

const otter: GroupName = {
  animalId: "otter",
  text: { de: "Otter", en: "Otter" },
};
const fox: GroupName = { animalId: "fuchs", text: { de: "Fuchs", en: "Fox" } };

const envelope = { revision: 1, participantCount: 3 };

function ownGroup(name: GroupName) {
  return {
    name,
    memberDisplayNames: ["Ada"],
    assignedValues: [],
    workStatus: GroupWorkStatus.Editing,
  };
}

const joinState: ParticipantWorkshopState = {
  ...envelope,
  phase: Phase.Join,
  ownDisplayName: "Ada",
};

describe("own group memory", () => {
  it("knows no group before the groups are formed", () => {
    expect(rememberOwnGroupName(null, joinState)).toBeNull();
    expect(
      rememberOwnGroupName(null, {
        ...envelope,
        phase: Phase.GroupFormation,
        formation: { subState: FormationSubState.Forming, progress: 0.4 },
      }),
    ).toBeNull();
  });

  it("takes the group name the formation deals out", () => {
    expect(
      rememberOwnGroupName(null, {
        ...envelope,
        phase: Phase.GroupFormation,
        formation: {
          subState: FormationSubState.Formed,
          ownGroup: ownGroup(otter),
        },
      }),
    ).toEqual(otter);
  });

  it("follows the own group the group work and presentation phases carry", () => {
    expect(
      rememberOwnGroupName(otter, {
        ...envelope,
        phase: Phase.GroupWork,
        ownGroup: ownGroup(fox),
      }),
    ).toEqual(fox);
    expect(
      rememberOwnGroupName(otter, {
        ...envelope,
        phase: Phase.ValuePresentation,
        ownGroup: null,
        presentation: {
          presentingGroupName: null,
          presentedValueId: null,
          presentedActions: [],
        },
      }),
    ).toBeNull();
  });

  it("keeps the remembered group through the voting and the finale", () => {
    expect(
      rememberOwnGroupName(otter, {
        ...envelope,
        phase: Phase.FinalVoting,
        voting: {
          roundNumber: 1,
          allotment: 5,
          eligibleValues: [],
          isRoundOpen: true,
          hasVotedThisRound: false,
        },
      }),
    ).toEqual(otter);
    expect(
      rememberOwnGroupName(otter, {
        ...envelope,
        phase: Phase.FinalPresentation,
        conclusion: { isConcluded: false },
      }),
    ).toEqual(otter);
  });

  it("forgets the group when the workshop starts over", () => {
    expect(rememberOwnGroupName(otter, joinState)).toBeNull();
  });
});
