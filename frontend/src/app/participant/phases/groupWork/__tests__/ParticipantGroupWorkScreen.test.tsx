import { render, screen } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import {
  GroupWorkStatus,
  type ParticipantGroupWorkState,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantGroupWorkScreen } from "../ParticipantGroupWorkScreen";
import { useGroupWorkCard, type GroupWorkCardModel } from "../useGroupWorkCard";

jest.mock("../useGroupWorkCard", () => ({
  useGroupWorkCard: jest.fn(),
}));

const hookMock = useGroupWorkCard as jest.MockedFunction<
  typeof useGroupWorkCard
>;

function model(): GroupWorkCardModel {
  return {
    groupName: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
    memberDisplayNames: ["Alice"],
    scribeName: "Alice",
    isCallerScribe: true,
    isSubmitted: false,
    assignedValues: [
      { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
    ],
    selectedValueId: "trust",
    selectValue: jest.fn(),
    actionsForSelectedValue: [],
    localTexts: {},
    addAction: jest.fn(),
    editActionText: jest.fn(),
    removeAction: jest.fn(),
    submitGroupWork: jest.fn(),
    reopenGroupWork: jest.fn(),
    canSubmit: false,
    isSending: false,
    rejectionMessage: null,
  };
}

function state(
  ownGroup: ParticipantGroupWorkState["ownGroup"],
): ParticipantGroupWorkState {
  return {
    phase: Phase.GroupWork,
    revision: 1,
    participantCount: 3,
    ownGroup,
  };
}

describe("ParticipantGroupWorkScreen", () => {
  it("renders the group work card when ownGroup is present", () => {
    hookMock.mockReturnValue(model());
    const ownGroup = {
      name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
      memberDisplayNames: ["Alice"],
      assignedValues: [
        { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
      ],
      isCallerScribe: true,
      scribeName: "Alice",
      workStatus: GroupWorkStatus.Editing,
      actions: [],
    };

    render(<ParticipantGroupWorkScreen state={state(ownGroup)} />, {
      wrapper: languageWrapper(),
    });

    expect(
      screen.getByTestId("participant-group-work-screen"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("group-work-card")).toBeInTheDocument();
  });

  it("renders nothing when ownGroup is null", () => {
    const { container } = render(
      <ParticipantGroupWorkScreen state={state(null)} />,
      { wrapper: languageWrapper() },
    );

    expect(container.innerHTML).toBe("");
  });
});
