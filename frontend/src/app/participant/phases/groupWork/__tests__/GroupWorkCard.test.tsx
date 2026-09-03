import { render, screen, fireEvent } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { MessageKey } from "../../../../../domain/i18n/messages";
import {
  GroupWorkStatus,
  type OwnGroupView,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { GroupWorkCard } from "../GroupWorkCard";
import { useGroupWorkCard, type GroupWorkCardModel } from "../useGroupWorkCard";

jest.mock("../useGroupWorkCard", () => ({
  ...jest.requireActual("../useGroupWorkCard"),
  useGroupWorkCard: jest.fn(),
}));

const screenHook = useGroupWorkCard as jest.MockedFunction<
  typeof useGroupWorkCard
>;

const ownGroupFixture: OwnGroupView = {
  name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
  memberDisplayNames: ["Alice", "Bob"],
  assignedValues: [
    { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
    { valueId: "courage", text: { de: "Mut", en: "Courage" } },
  ],
  isCallerScribe: true,
  scribeName: "Alice",
  workStatus: GroupWorkStatus.Editing,
  actions: [],
};

function model(
  overrides: Partial<GroupWorkCardModel> = {},
): GroupWorkCardModel {
  return {
    groupName: ownGroupFixture.name,
    memberDisplayNames: ["Alice", "Bob"],
    scribeName: "Alice",
    isCallerScribe: true,
    isSubmitted: false,
    assignedValues: ownGroupFixture.assignedValues,
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
    ...overrides,
  };
}

describe("GroupWorkCard", () => {
  it("shows the group name and members", () => {
    screenHook.mockReturnValue(model());

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-work-name")).toHaveTextContent("Otter");
    expect(screen.getAllByTestId("group-work-member")).toHaveLength(2);
  });

  it("names the scribe and tells the scribe it is them", () => {
    screenHook.mockReturnValue(model());

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-work-scribe")).toHaveTextContent(
      "Scribe: Alice (you)",
    );
  });

  it("names the scribe plainly for the other members", () => {
    screenHook.mockReturnValue(model({ isCallerScribe: false }));

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-work-scribe")).toHaveTextContent(
      /^Scribe: Alice$/,
    );
  });

  it("colours the card in the animal hue", () => {
    screenHook.mockReturnValue(model());

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-work-card")).toHaveAttribute(
      "data-animal",
      "otter",
    );
  });

  it("shows the work status as a pill", () => {
    screenHook.mockReturnValue(model());

    render(
      <GroupWorkCard
        ownGroup={{
          ...ownGroupFixture,
          workStatus: GroupWorkStatus.Submitted,
        }}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("group-work-status")).toHaveTextContent(
      /^Submitted$/,
    );
  });

  it("renders value tabs and highlights the selected one", () => {
    screenHook.mockReturnValue(model({ selectedValueId: "trust" }));

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("value-tab-trust")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("value-tab-courage")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("forwards value tab selection to the hook", () => {
    const selectValue = jest.fn();
    screenHook.mockReturnValue(model({ selectValue }));

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("value-tab-courage"));

    expect(selectValue).toHaveBeenCalledWith("courage");
  });

  it("shows action inputs for scribe in editing mode", () => {
    screenHook.mockReturnValue(
      model({
        actionsForSelectedValue: [
          { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
        ],
      }),
    );

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("action-input-a1")).toBeInTheDocument();
    expect(screen.getByTestId("remove-action-a1")).toBeInTheDocument();
  });

  it("shows read-only text for non-scribe", () => {
    screenHook.mockReturnValue(
      model({
        isCallerScribe: false,
        actionsForSelectedValue: [
          { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
        ],
      }),
    );

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("action-text-a1")).toHaveTextContent("Talk");
    expect(screen.queryByTestId("action-input-a1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("add-action-button")).not.toBeInTheDocument();
  });

  it("labels the remove control for screen readers", () => {
    const removeAction = jest.fn();
    screenHook.mockReturnValue(
      model({
        removeAction,
        actionsForSelectedValue: [
          { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
        ],
      }),
    );

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(removeAction).toHaveBeenCalledWith("a1");
  });

  it("shows submit button with disabled hint when cannot submit", () => {
    screenHook.mockReturnValue(model({ canSubmit: false }));

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submit-group-work-button")).toBeDisabled();
    expect(screen.getByTestId("submit-group-work-button")).toHaveTextContent(
      "Submit result",
    );
    expect(screen.getByTestId("submit-disabled-hint")).toHaveTextContent(
      "Every assigned value needs at least one action with text.",
    );
  });

  it("drops the hint once the result can be submitted", () => {
    screenHook.mockReturnValue(model({ canSubmit: true }));

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submit-group-work-button")).toBeEnabled();
    expect(
      screen.queryByTestId("submit-disabled-hint"),
    ).not.toBeInTheDocument();
  });

  it("shows the rejection message", () => {
    screenHook.mockReturnValue(
      model({ rejectionMessage: MessageKey.IntentMalformedPayload }),
    );

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "That request was malformed.",
    );
  });

  it("shows reopen button when submitted", () => {
    screenHook.mockReturnValue(model({ isSubmitted: true }));

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("reopen-button")).toBeInTheDocument();
    expect(
      screen.queryByTestId("submit-group-work-button"),
    ).not.toBeInTheDocument();
  });

  it("forwards add action to the hook", () => {
    const addAction = jest.fn();
    screenHook.mockReturnValue(model({ addAction }));

    render(<GroupWorkCard ownGroup={ownGroupFixture} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("add-action-button"));

    expect(addAction).toHaveBeenCalled();
  });

  it("speaks German when German is chosen", () => {
    screenHook.mockReturnValue(model({ isSubmitted: true }));

    render(
      <GroupWorkCard
        ownGroup={{
          ...ownGroupFixture,
          workStatus: GroupWorkStatus.Submitted,
        }}
      />,
      { wrapper: languageWrapper(Language.German) },
    );

    expect(screen.getByTestId("group-work-scribe")).toHaveTextContent(
      "Schreiber/in: Alice (du)",
    );
    expect(screen.getByTestId("reopen-button")).toHaveTextContent(
      "Ergebnis zurücknehmen",
    );
    expect(screen.getByTestId("group-work-status")).toHaveTextContent(
      "Abgegeben",
    );
  });
});
