import { render, screen, fireEvent } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import {
  FacilitatorIntent,
  GroupWorkStatus,
  type FacilitatorGroupWorkState,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorGroupWorkScreen } from "../FacilitatorGroupWorkScreen";
import {
  useFacilitatorGroupWorkScreen,
  type FacilitatorGroupWorkScreenModel,
} from "../useFacilitatorGroupWorkScreen";

jest.mock("../useFacilitatorGroupWorkScreen", () => ({
  ...jest.requireActual("../useFacilitatorGroupWorkScreen"),
  useFacilitatorGroupWorkScreen: jest.fn(),
}));

const screenHook = useFacilitatorGroupWorkScreen as jest.MockedFunction<
  typeof useFacilitatorGroupWorkScreen
>;

function state(): FacilitatorGroupWorkState {
  return {
    phase: Phase.GroupWork,
    revision: 1,
    roster: { participants: [], participantCount: 3 },
    enabledIntents: [FacilitatorIntent.ReassignScribe],
    groups: [],
  };
}

function model(
  overrides: Partial<FacilitatorGroupWorkScreenModel> = {},
): FacilitatorGroupWorkScreenModel {
  return {
    rows: [
      {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        members: [
          { participantId: "p1", displayName: "Alice" },
          { participantId: "p2", displayName: "Bob" },
        ],
        scribeParticipantId: "p1",
        workStatus: GroupWorkStatus.Editing,
        actionCount: 3,
      },
    ],
    reassignScribe: jest.fn(),
    isSending: false,
    rejectionMessage: null,
    ...overrides,
  };
}

describe("FacilitatorGroupWorkScreen", () => {
  it("renders a table with group rows", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-work-table")).toBeInTheDocument();
    expect(screen.getByTestId("group-row-otter")).toBeInTheDocument();
    expect(screen.getByTestId("group-row-name")).toHaveTextContent("Otter");
  });

  it("shows the action count", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-row-action-count")).toHaveTextContent("3");
  });

  it("shows the editing status badge", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-status-otter")).toHaveTextContent(
      "Editing",
    );
  });

  it("shows the submitted status badge", () => {
    const editing = model();
    screenHook.mockReturnValue({
      ...editing,
      rows: editing.rows.map((row) => ({
        ...row,
        workStatus: GroupWorkStatus.Submitted,
      })),
    });

    render(<FacilitatorGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-status-otter")).toHaveTextContent(
      "Submitted",
    );
  });

  it("preselects the current scribe", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("scribe-select-otter")).toHaveValue("p1");
    expect(screen.getByTestId("scribe-select-otter")).toHaveAccessibleName(
      "Scribe",
    );
  });

  it("forwards scribe reassignment through the select", () => {
    const reassignScribe = jest.fn();
    screenHook.mockReturnValue(model({ reassignScribe }));

    render(<FacilitatorGroupWorkScreen state={state()} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.change(screen.getByTestId("scribe-select-otter"), {
      target: { value: "p2" },
    });

    expect(reassignScribe).toHaveBeenCalledWith("p2");
  });
});
