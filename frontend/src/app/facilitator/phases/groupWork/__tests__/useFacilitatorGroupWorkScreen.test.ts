import { renderHook, act } from "@testing-library/react";
import { NEVER, of } from "rxjs";
import type { IntentResult } from "../../../../../domain/intentResult";
import { Phase } from "../../../../../domain/phases";
import {
  FacilitatorIntent,
  GroupWorkStatus,
  type FacilitatorGroupWorkState,
} from "../../../../../domain/workshopState";
import { useFacilitatorDependencies } from "../../../dependencies";
import { useFacilitatorGroupWorkScreen } from "../useFacilitatorGroupWorkScreen";

jest.mock("../../../dependencies", () => ({
  useFacilitatorDependencies: jest.fn(),
}));

const dependencies = useFacilitatorDependencies as jest.MockedFunction<
  typeof useFacilitatorDependencies
>;

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

function mockDependencies(reassignScribe = jest.fn(() => of(accepted))) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    lifecyclePort: { advancePhase: () => NEVER },
    quizControlPort: {
      revealAnswer: () => NEVER,
      showLearningText: () => NEVER,
      poseNextQuestion: () => NEVER,
    },
    groupWorkControlPort: { reassignScribe },
    walkControlPort: {
      goToNextValue: () => NEVER,
      correctActionWording: () => NEVER,
    },
  });
  return reassignScribe;
}

function state(
  groups: FacilitatorGroupWorkState["groups"],
): FacilitatorGroupWorkState {
  return {
    phase: Phase.GroupWork,
    revision: 1,
    roster: { participants: [], participantCount: 3 },
    enabledIntents: [FacilitatorIntent.ReassignScribe],
    groups,
  };
}

describe("useFacilitatorGroupWorkScreen", () => {
  it("reports all submitted when every group is submitted", () => {
    mockDependencies();
    const groups = [
      {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        members: [{ participantId: "p1", displayName: "Alice" }],
        assignedValues: [],
        scribeParticipantId: "p1",
        workStatus: GroupWorkStatus.Submitted,
        actionCountPerValue: {},
      },
    ];
    const { result } = renderHook(() =>
      useFacilitatorGroupWorkScreen(state(groups)),
    );

    expect(result.current.allSubmitted).toBe(true);
  });

  it("reports not all submitted when any group is editing", () => {
    mockDependencies();
    const groups = [
      {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        members: [{ participantId: "p1", displayName: "Alice" }],
        assignedValues: [],
        scribeParticipantId: "p1",
        workStatus: GroupWorkStatus.Editing,
        actionCountPerValue: {},
      },
    ];
    const { result } = renderHook(() =>
      useFacilitatorGroupWorkScreen(state(groups)),
    );

    expect(result.current.allSubmitted).toBe(false);
  });

  it("sends reassignScribe through the port", () => {
    const reassignScribe = mockDependencies();
    const groups = [
      {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        members: [
          { participantId: "p1", displayName: "Alice" },
          { participantId: "p2", displayName: "Bob" },
        ],
        assignedValues: [],
        scribeParticipantId: "p1",
        workStatus: GroupWorkStatus.Editing,
        actionCountPerValue: {},
      },
    ];
    const { result } = renderHook(() =>
      useFacilitatorGroupWorkScreen(state(groups)),
    );

    act(() => result.current.reassignScribe("p2"));

    expect(reassignScribe).toHaveBeenCalledWith("p2");
  });
});
