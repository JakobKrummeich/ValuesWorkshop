import { fireEvent, render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantSelectionState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantSelectionScreen } from "../ParticipantSelectionScreen";
import {
  useParticipantSelectionScreen,
  type ParticipantSelectionScreenModel,
  type SelectionChip,
} from "../useParticipantSelectionScreen";

jest.mock("../useParticipantSelectionScreen", () => ({
  ...jest.requireActual("../useParticipantSelectionScreen"),
  useParticipantSelectionScreen: jest.fn(),
}));

const screenHook = useParticipantSelectionScreen as jest.MockedFunction<
  typeof useParticipantSelectionScreen
>;

const values = [
  { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
  { valueId: "courage", text: { de: "Mut", en: "Courage" } },
  { valueId: "respect", text: { de: "Respekt", en: "Respect" } },
];

const state: ParticipantSelectionState = {
  phase: Phase.ValueSelection,
  revision: 9,
  participantCount: 3,
  selection: {
    values,
    ownSelectedValueIds: [],
    isSubmitted: false,
  },
};

function chip(overrides: Partial<SelectionChip> = {}): SelectionChip {
  return {
    valueId: "trust",
    text: values[0].text,
    isSelected: false,
    isDisabled: false,
    ...overrides,
  };
}

function model(
  overrides: Partial<ParticipantSelectionScreenModel> = {},
): ParticipantSelectionScreenModel {
  return {
    chips: values.map((value) =>
      chip({ valueId: value.valueId, text: value.text }),
    ),
    selectedCount: 0,
    isSubmitted: false,
    canSubmit: false,
    isConfirming: false,
    toggleValue: jest.fn(),
    requestSubmission: jest.fn(),
    cancelSubmission: jest.fn(),
    confirmSubmission: jest.fn(),
    rejectionMessage: null,
    ...overrides,
  };
}

describe("participant selection screen", () => {
  it("shows the prompt with the selection counter", () => {
    screenHook.mockReturnValue(model({ selectedCount: 7 }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Pick exactly 10 values");
    expect(screen.getByTestId("selected-count")).toHaveTextContent(
      "Selected: 7/10",
    );
  });

  it("renders every value as a toggle chip", () => {
    const toggleValue = jest.fn();
    screenHook.mockReturnValue(model({ toggleValue }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("value-chip-courage"));

    expect(screen.getByTestId("value-chip-trust")).toHaveTextContent("Trust");
    expect(toggleValue).toHaveBeenCalledWith("courage");
  });

  it("marks selected and disabled chips for styling and the at-ten lock", () => {
    screenHook.mockReturnValue(
      model({
        chips: [
          chip({ valueId: "trust", isSelected: true }),
          chip({ valueId: "courage", text: values[1].text, isDisabled: true }),
          chip({ valueId: "respect", text: values[2].text }),
        ],
      }),
    );

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("value-chip-trust")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("value-chip-courage")).toBeDisabled();
    expect(screen.getByTestId("value-chip-respect")).not.toBeDisabled();
  });

  it("disables the submit button until the hook allows submission", () => {
    screenHook.mockReturnValue(model({ canSubmit: false }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submit-selection-button")).toBeDisabled();
  });

  it("requests confirmation when the enabled submit button is pressed", () => {
    const requestSubmission = jest.fn();
    screenHook.mockReturnValue(model({ canSubmit: true, requestSubmission }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("submit-selection-button"));

    expect(requestSubmission).toHaveBeenCalled();
  });

  it("hides the confirmation dialog while none is requested", () => {
    screenHook.mockReturnValue(model());

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms the irrevocable submission through an accessible dialog", () => {
    const confirmSubmission = jest.fn();
    screenHook.mockReturnValue(
      model({ isConfirming: true, confirmSubmission }),
    );

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Submit your selection for good?");
    screen.getByText("Your selection cannot be changed afterwards.");
    expect(screen.getByTestId("confirm-cancel-button")).toHaveFocus();

    fireEvent.click(screen.getByTestId("confirm-submit-button"));
    expect(confirmSubmission).toHaveBeenCalled();
  });

  it("cancels the confirmation dialog", () => {
    const cancelSubmission = jest.fn();
    screenHook.mockReturnValue(model({ isConfirming: true, cancelSubmission }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("confirm-cancel-button"));

    expect(cancelSubmission).toHaveBeenCalled();
  });

  it("closes the confirmation dialog on escape", () => {
    const cancelSubmission = jest.fn();
    screenHook.mockReturnValue(model({ isConfirming: true, cancelSubmission }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(cancelSubmission).toHaveBeenCalled();
  });

  it("replaces the submit button with a notice once submitted", () => {
    screenHook.mockReturnValue(model({ isSubmitted: true }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(
      screen.queryByTestId("submit-selection-button"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("submitted-notice")).toHaveTextContent(
      "Your selection has been submitted.",
    );
  });

  it("shows the rejection message", () => {
    screenHook.mockReturnValue(
      model({ rejectionMessage: MessageKey.IntentMalformedPayload }),
    );

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("That request was malformed.");
  });

  it("speaks German when German is chosen", () => {
    screenHook.mockReturnValue(model({ selectedCount: 7 }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    screen.getByText("Wähle genau 10 Werte");
    expect(screen.getByTestId("selected-count")).toHaveTextContent(
      "Ausgewählt: 7/10",
    );
    expect(screen.getByTestId("value-chip-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });
});
