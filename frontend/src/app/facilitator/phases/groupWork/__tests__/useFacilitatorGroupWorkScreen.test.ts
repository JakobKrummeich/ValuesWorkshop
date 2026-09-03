import { renderHook, act } from "@testing-library/react";
import { NEVER, Observable, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { IntentRejectionCode } from "../../../../../domain/intentResult";
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
    votingControlPort: {
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    },
    conclusionControlPort: { revealNextValue: () => NEVER },
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

  it("reports a rejected reassignment under its rejection message", () => {
    mockDependencies(
      jest.fn(() =>
        of({
          isAccepted: false,
          code: IntentRejectionCode.WrongPhase,
          detail: "group work is over",
        }),
      ),
    );
    const { result } = renderHook(() =>
      useFacilitatorGroupWorkScreen(state(oneEditingGroup())),
    );

    act(() => result.current.reassignScribe("p2"));

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentWrongPhase);
    expect(result.current.isSending).toBe(false);
  });

  it("reports a transport failure as a generic failure message", () => {
    mockDependencies(
      jest.fn(() => throwError(() => new Error("connection is closed"))),
    );
    const { result } = renderHook(() =>
      useFacilitatorGroupWorkScreen(state(oneEditingGroup())),
    );

    act(() => result.current.reassignScribe("p2"));

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
    expect(result.current.isSending).toBe(false);
  });

  it("reports an in-flight reassignment", () => {
    mockDependencies(jest.fn(() => NEVER));
    const { result } = renderHook(() =>
      useFacilitatorGroupWorkScreen(state(oneEditingGroup())),
    );

    act(() => result.current.reassignScribe("p2"));

    expect(result.current.isSending).toBe(true);
  });

  it("abandons an in-flight reassignment when the screen is left", () => {
    let isAbandoned = false;
    mockDependencies(
      jest.fn(
        () =>
          new Observable<IntentResult>(() => () => {
            isAbandoned = true;
          }),
      ),
    );
    const { result, unmount } = renderHook(() =>
      useFacilitatorGroupWorkScreen(state(oneEditingGroup())),
    );

    act(() => result.current.reassignScribe("p2"));
    unmount();

    expect(isAbandoned).toBe(true);
  });
});

function oneEditingGroup(): FacilitatorGroupWorkState["groups"] {
  return [
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
}
