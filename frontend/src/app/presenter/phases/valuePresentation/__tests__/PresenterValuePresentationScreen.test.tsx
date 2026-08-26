import { render, screen } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import type { PresenterValuePresentationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterValuePresentationScreen } from "../PresenterValuePresentationScreen";
import { PresentationPositionKind } from "../../../../../domain/presentationPosition";
import {
  usePresenterValuePresentationScreen,
  type PresenterPresentationPosition,
} from "../usePresenterValuePresentationScreen";

jest.mock("../usePresenterValuePresentationScreen", () => ({
  ...jest.requireActual("../usePresenterValuePresentationScreen"),
  usePresenterValuePresentationScreen: jest.fn(),
}));

const screenHook = usePresenterValuePresentationScreen as jest.MockedFunction<
  typeof usePresenterValuePresentationScreen
>;

function state(): PresenterValuePresentationState {
  return {
    phase: Phase.ValuePresentation,
    revision: 1,
    participantCount: 0,
    groups: [],
    presentation: {
      presentingGroupName: null,
      presentedValueId: null,
      presentedActions: [],
    },
  };
}

function renderWith(position: PresenterPresentationPosition | null) {
  screenHook.mockReturnValue(position);

  return render(<PresenterValuePresentationScreen state={state()} />, {
    wrapper: languageWrapper(),
  });
}

describe("PresenterValuePresentationScreen", () => {
  it("renders the group intro fullscreen", () => {
    renderWith({
      kind: PresentationPositionKind.GroupIntro,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
    });

    expect(screen.getByTestId("group-intro-otter")).toHaveTextContent("Otter");
  });

  it("renders the presented value with its numbered actions", () => {
    renderWith({
      kind: PresentationPositionKind.PresentedValue,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
      valueName: { de: "Vertrauen", en: "Trust" },
      actions: [
        { text: "We start meetings on time" },
        { text: "We ask before assuming" },
      ],
    });

    expect(screen.getByTestId("presenter-presenting-group")).toHaveTextContent(
      "Otter",
    );
    expect(screen.getByTestId("presenter-presented-value")).toHaveTextContent(
      "Trust",
    );
    expect(
      screen.getAllByTestId("presented-action").map((item) => item.textContent),
    ).toEqual(["We start meetings on time", "We ask before assuming"]);
  });

  it("renders nothing without a presenting position", () => {
    const { container } = renderWith(null);

    expect(container).toBeEmptyDOMElement();
  });
});
