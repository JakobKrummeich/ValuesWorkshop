import { render, screen } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import {
  GroupWorkStatus,
  type PresenterGroupWorkState,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { type GroupPages, useGroupPages } from "../../../useGroupPages";
import { PresenterGroupWorkScreen } from "../PresenterGroupWorkScreen";

jest.mock("../../../useGroupPages", () => ({
  ...jest.requireActual("../../../useGroupPages"),
  useGroupPages: jest.fn(),
}));

const screenHook = useGroupPages as jest.MockedFunction<
  typeof useGroupPages<PresenterGroupWorkState["groups"][number]>
>;

function state(): PresenterGroupWorkState {
  return {
    phase: Phase.GroupWork,
    revision: 1,
    participantCount: 3,
    groups: [],
  };
}

type GroupWorkPages = GroupPages<PresenterGroupWorkState["groups"][number]>;

function model(overrides: Partial<GroupWorkPages> = {}): GroupWorkPages {
  return {
    pageIndex: 0,
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

  it("leaves the card without a status slot while the group has no work status", () => {
    screenHook.mockReturnValue(
      model({
        currentPageGroups: [
          {
            name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
            memberDisplayNames: ["Alice"],
            assignedValues: [],
          },
        ],
      }),
    );

    const { container } = render(<PresenterGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("presenter-group-status-otter")).toBeNull();
    expect(container.querySelector(".status")).toBeNull();
  });
});
