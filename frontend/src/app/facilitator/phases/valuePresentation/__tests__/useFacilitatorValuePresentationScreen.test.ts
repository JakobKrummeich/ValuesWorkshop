import { act, renderHook } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { PresentationPositionKind } from "../../../../../domain/presentationPosition";
import { Phase } from "../../../../../domain/phases";
import {
  FacilitatorIntent,
  type FacilitatorValuePresentationState,
} from "../../../../../domain/workshopState";
import { useFacilitatorDependencies } from "../../../dependencies";
import { useFacilitatorValuePresentationScreen } from "../useFacilitatorValuePresentationScreen";

jest.mock("../../../dependencies", () => ({
  useFacilitatorDependencies: jest.fn(),
}));

const dependencies = useFacilitatorDependencies as jest.MockedFunction<
  typeof useFacilitatorDependencies
>;

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

function mockWalkControl(
  goToNextValue = jest.fn(() => of(accepted)),
  correctActionWording = jest.fn(() => of(accepted)),
) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    lifecyclePort: { advancePhase: () => NEVER },
    quizControlPort: {
      revealAnswer: () => NEVER,
      showLearningText: () => NEVER,
      poseNextQuestion: () => NEVER,
    },
    groupWorkControlPort: { reassignScribe: () => NEVER },
    walkControlPort: { goToNextValue, correctActionWording },
    votingControlPort: {
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    },
  });

  return { goToNextValue, correctActionWording };
}

function state(
  overrides: Partial<FacilitatorValuePresentationState> = {},
): FacilitatorValuePresentationState {
  return {
    phase: Phase.ValuePresentation,
    revision: 9,
    roster: { participants: [], participantCount: 0 },
    enabledIntents: [FacilitatorIntent.GoToNextValue],
    groups: [
      {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        members: [],
        assignedValues: [
          { valueId: "wert-1", text: { de: "Vertrauen", en: "Trust" } },
        ],
      },
    ],
    presentation: {
      presentingGroupName: "otter",
      presentedValueId: "wert-1",
      presentedActions: [{ actionId: "action-1", text: "We ask" }],
    },
    ...overrides,
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("useFacilitatorValuePresentationScreen", () => {
  it("derives the presented value position with its actions", () => {
    mockWalkControl();

    const { result } = renderHook(() =>
      useFacilitatorValuePresentationScreen(state()),
    );

    expect(result.current.position).toEqual({
      kind: PresentationPositionKind.PresentedValue,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
      valueName: { de: "Vertrauen", en: "Trust" },
      actions: [{ actionId: "action-1", text: "We ask" }],
    });
  });

  it("derives the group intro while no value is presented", () => {
    mockWalkControl();

    const { result } = renderHook(() =>
      useFacilitatorValuePresentationScreen(
        state({
          presentation: {
            presentingGroupName: "otter",
            presentedValueId: null,
            presentedActions: [],
          },
        }),
      ),
    );

    expect(result.current.position).toEqual({
      kind: PresentationPositionKind.GroupIntro,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
    });
  });

  it("enables the next step exactly when the backend lists it", () => {
    mockWalkControl();

    const { result, rerender } = renderHook(
      (screenState: FacilitatorValuePresentationState) =>
        useFacilitatorValuePresentationScreen(screenState),
      { initialProps: state() },
    );
    expect(result.current.isNextValueEnabled).toBe(true);

    rerender(state({ enabledIntents: [FacilitatorIntent.AdvancePhase] }));
    expect(result.current.isNextValueEnabled).toBe(false);
  });

  it("sends the next-value intent through the walk control port", () => {
    const { goToNextValue } = mockWalkControl();

    const { result } = renderHook(() =>
      useFacilitatorValuePresentationScreen(state()),
    );
    act(() => result.current.goToNextValue());

    expect(goToNextValue).toHaveBeenCalledTimes(1);
    expect(result.current.rejectionMessage).toBeNull();
  });

  it("sends a wording correction for the given action", () => {
    const { correctActionWording } = mockWalkControl();

    const { result } = renderHook(() =>
      useFacilitatorValuePresentationScreen(state()),
    );
    act(() => result.current.correctActionWording("action-1", "We listen"));

    expect(correctActionWording).toHaveBeenCalledWith("action-1", "We listen");
  });

  it("surfaces a rejection of the next step", () => {
    mockWalkControl(
      jest.fn(() => of({ isAccepted: false, code: 2, detail: "nothing left" })),
    );

    const { result } = renderHook(() =>
      useFacilitatorValuePresentationScreen(state()),
    );
    act(() => result.current.goToNextValue());

    expect(result.current.rejectionMessage).not.toBeNull();
  });

  it("reports a transport failure", () => {
    mockWalkControl(jest.fn(() => throwError(() => new Error("closed"))));

    const { result } = renderHook(() =>
      useFacilitatorValuePresentationScreen(state()),
    );
    act(() => result.current.goToNextValue());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });
});
