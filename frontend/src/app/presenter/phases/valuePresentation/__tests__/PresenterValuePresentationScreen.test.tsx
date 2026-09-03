import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import { PresentationPositionKind } from "../../../../../domain/presentationPosition";
import type { PresenterValuePresentationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterValuePresentationScreen } from "../PresenterValuePresentationScreen";
import {
  type PresenterPresentationPosition,
  usePresenterValuePresentationScreen,
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

function presentedValue(): PresenterPresentationPosition {
  return {
    kind: PresentationPositionKind.PresentedValue,
    animalId: "otter",
    groupName: { de: "Otter", en: "Otter" },
    valueId: "trust",
    valueName: { de: "Vertrauen", en: "Trust" },
    actions: [
      { text: "We start meetings on time" },
      { text: "We ask before assuming" },
    ],
  };
}

function renderWith(
  position: PresenterPresentationPosition | null,
  language?: Language,
) {
  screenHook.mockReturnValue(position);

  return render(<PresenterValuePresentationScreen state={state()} />, {
    wrapper: languageWrapper(language),
  });
}

describe("PresenterValuePresentationScreen", () => {
  it("introduces the group with its glyph in its hue", () => {
    renderWith({
      kind: PresentationPositionKind.GroupIntro,
      animalId: "otter",
      groupName: { de: "Otter", en: "Otter" },
    });

    const intro = screen.getByTestId("group-intro-otter");
    expect(intro).toHaveTextContent("Up next");
    expect(intro).toHaveTextContent("Otter");
    expect(intro).toHaveAttribute("data-animal", "otter");
    expect(intro.querySelector("svg")).not.toBeNull();
  });

  it("presents the value with the group and its actions as slabs", () => {
    renderWith(presentedValue());

    expect(screen.getByTestId("presented-value-screen")).toHaveAttribute(
      "data-animal",
      "otter",
    );
    expect(screen.getByTestId("presenter-presenting-group")).toHaveTextContent(
      /^Otter$/,
    );
    expect(screen.getByText("presents")).toBeInTheDocument();
    expect(screen.getByTestId("presenter-presented-value")).toHaveTextContent(
      "Trust",
    );
    expect(
      screen.getAllByTestId("presented-action").map((item) => item.textContent),
    ).toEqual(["We start meetings on time", "We ask before assuming"]);
    expect(screen.getAllByTestId("presented-action")[1]).toHaveStyle({
      "--index": "1",
    });
  });

  it("speaks German when German is chosen", () => {
    renderWith(presentedValue(), Language.German);

    expect(screen.getByText("präsentiert")).toBeInTheDocument();
    expect(screen.getByTestId("presenter-presented-value")).toHaveTextContent(
      "Vertrauen",
    );
  });

  it("renders nothing without a presenting position", () => {
    const { container } = renderWith(null);

    expect(container).toBeEmptyDOMElement();
  });
});
