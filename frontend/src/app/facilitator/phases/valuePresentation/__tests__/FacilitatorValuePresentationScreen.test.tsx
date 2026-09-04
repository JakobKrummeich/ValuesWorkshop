import { fireEvent, render, screen } from "@testing-library/react";
import { PresentationPositionKind } from "../../../../../domain/presentationPosition";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorValuePresentationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorValuePresentationScreen } from "../FacilitatorValuePresentationScreen";
import {
  useFacilitatorValuePresentationScreen,
  type FacilitatorValuePresentationScreenModel,
} from "../useFacilitatorValuePresentationScreen";

jest.mock("../useFacilitatorValuePresentationScreen", () => ({
  useFacilitatorValuePresentationScreen: jest.fn(),
}));

const screenHook = useFacilitatorValuePresentationScreen as jest.MockedFunction<
  typeof useFacilitatorValuePresentationScreen
>;

function state(): FacilitatorValuePresentationState {
  return {
    phase: Phase.ValuePresentation,
    revision: 1,
    roster: { participants: [], participantCount: 0 },
    enabledIntents: [],
    groups: [],
    presentation: {
      presentingGroupName: null,
      presentedValueId: null,
      presentedActions: [],
    },
  };
}

function model(
  overrides: Partial<FacilitatorValuePresentationScreenModel> = {},
): FacilitatorValuePresentationScreenModel {
  return {
    position: {
      kind: PresentationPositionKind.PresentedValue,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
      valueId: "wert-1",
      valueName: { de: "Vertrauen", en: "Trust" },
      actions: [{ actionId: "action-1", text: "We ask before assuming" }],
    },
    isNextValueEnabled: true,
    isSending: false,
    rejectionMessage: null,
    goToNextValue: jest.fn(),
    correctActionWording: jest.fn(),
    ...overrides,
  };
}

function renderWith(
  overrides: Partial<FacilitatorValuePresentationScreenModel> = {},
) {
  const screenModel = model(overrides);
  screenHook.mockReturnValue(screenModel);

  render(<FacilitatorValuePresentationScreen state={state()} />, {
    wrapper: languageWrapper(),
  });

  return screenModel;
}

describe("FacilitatorValuePresentationScreen", () => {
  it("shows the presenting position with an editor per action", () => {
    renderWith();

    expect(screen.getByTestId("presenting-position")).toHaveTextContent(
      "Presenting: Otter · Trust",
    );
    expect(screen.getByTestId("presented-action-input-action-1")).toHaveValue(
      "We ask before assuming",
    );
  });

  it("announces the group up next on an intro position", () => {
    renderWith({
      position: {
        kind: PresentationPositionKind.GroupIntro,
        animalId: "otter",
        groupName: { de: "Otter", en: "Otter" },
      },
    });

    expect(screen.getByTestId("presenting-position")).toHaveTextContent(
      "Up next: Otter",
    );
  });

  it("steps the walk from the next-value button", () => {
    const screenModel = renderWith();

    fireEvent.click(screen.getByTestId("next-value-button"));

    expect(screenModel.goToNextValue).toHaveBeenCalledTimes(1);
  });

  it("disables the next-value button when the walk has nowhere to go", () => {
    renderWith({ isNextValueEnabled: false });

    expect(screen.getByTestId("next-value-button")).toBeDisabled();
  });
});
