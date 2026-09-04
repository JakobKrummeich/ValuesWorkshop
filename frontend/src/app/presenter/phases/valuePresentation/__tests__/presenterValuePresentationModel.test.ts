import { renderHook } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import type { PresenterValuePresentationState } from "../../../../../domain/workshopState";
import { PresentationPositionKind } from "../../../../../domain/presentationPosition";
import { presenterValuePresentationModelOf } from "../presenterValuePresentationModel";

function state(
  presentation: PresenterValuePresentationState["presentation"],
): PresenterValuePresentationState {
  return {
    phase: Phase.ValuePresentation,
    revision: 9,
    participantCount: 3,
    groups: [
      {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        memberDisplayNames: ["Anna"],
        assignedValues: [
          {
            valueId: "wert-1",
            text: { de: "Vertrauen", en: "Trust" },
          },
        ],
      },
    ],
    presentation,
  };
}

describe("presenterValuePresentationModelOf", () => {
  it("shows the group intro while no value is presented", () => {
    const { result } = renderHook(() =>
      presenterValuePresentationModelOf(
        state({
          presentingGroupName: "otter",
          presentedValueId: null,
          presentedActions: [],
        }),
      ),
    );

    expect(result.current).toEqual({
      kind: PresentationPositionKind.GroupIntro,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
    });
  });

  it("shows the presented value with its action texts", () => {
    const { result } = renderHook(() =>
      presenterValuePresentationModelOf(
        state({
          presentingGroupName: "otter",
          presentedValueId: "wert-1",
          presentedActions: [{ text: "We start meetings on time" }],
        }),
      ),
    );

    expect(result.current).toEqual({
      kind: PresentationPositionKind.PresentedValue,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
      valueId: "wert-1",
      valueName: { de: "Vertrauen", en: "Trust" },
      actions: [{ text: "We start meetings on time" }],
    });
  });

  it("shows nothing while no group is presenting", () => {
    const { result } = renderHook(() =>
      presenterValuePresentationModelOf(
        state({
          presentingGroupName: null,
          presentedValueId: null,
          presentedActions: [],
        }),
      ),
    );

    expect(result.current).toBeNull();
  });

  it("shows nothing when the presented value is not among the groups values", () => {
    const { result } = renderHook(() =>
      presenterValuePresentationModelOf(
        state({
          presentingGroupName: "otter",
          presentedValueId: "wert-99",
          presentedActions: [],
        }),
      ),
    );

    expect(result.current).toBeNull();
  });
});
