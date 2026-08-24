import { render, screen } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import {
  GroupWorkStatus,
  type PresenterGroupWorkState,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterGroupWorkScreen } from "../PresenterGroupWorkScreen";
import {
  usePresenterGroupWorkScreen,
  type PresenterGroupWorkScreenModel,
} from "../usePresenterGroupWorkScreen";

jest.mock("../usePresenterGroupWorkScreen", () => ({
  ...jest.requireActual("../usePresenterGroupWorkScreen"),
  usePresenterGroupWorkScreen: jest.fn(),
}));

const screenHook = usePresenterGroupWorkScreen as jest.MockedFunction<
  typeof usePresenterGroupWorkScreen
>;

function state(): PresenterGroupWorkState {
  return {
    phase: Phase.GroupWork,
    revision: 1,
    participantCount: 3,
    groups: [],
  };
}

function model(
  overrides: Partial<PresenterGroupWorkScreenModel> = {},
): PresenterGroupWorkScreenModel {
  return {
    currentPageGroups: [
      {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        memberDisplayNames: ["Alice"],
        assignedValues: [
          { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
        ],
        workStatus: GroupWorkStatus.Editing,
      },
    ],
    ...overrides,
  };
}

describe("PresenterGroupWorkScreen", () => {
  it("renders group cards with status badges", () => {
    screenHook.mockReturnValue(model());

    render(<PresenterGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-card-otter")).toBeInTheDocument();
    expect(
      screen.getByTestId("presenter-group-status-otter"),
    ).toHaveTextContent("Editing");
  });

  it("shows submitted status badge", () => {
    screenHook.mockReturnValue(
      model({
        currentPageGroups: [
          {
            name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
            memberDisplayNames: ["Alice"],
            assignedValues: [],
            workStatus: GroupWorkStatus.Submitted,
          },
        ],
      }),
    );

    render(<PresenterGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(
      screen.getByTestId("presenter-group-status-otter"),
    ).toHaveTextContent("Submitted");
  });
});
