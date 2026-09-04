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
    remainingCount: 10,
    isSubmitted: false,
    canSubmit: false,
    isConfirming: false,
    toggleValue: jest.fn(),
    requestSubmission: jest.fn(),
    cancelSubmission: jest.fn(),
    confirmSubmission: jest.fn(),
    rejectionMessage: null,
    submitButtonRef: { current: null },
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

  it("renders every value chip and forwards a toggle", () => {
    const toggleValue = jest.fn();
    screenHook.mockReturnValue(model({ toggleValue }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("value-chip-courage"));

    expect(screen.getByTestId("value-chip-trust")).toHaveTextContent("Trust");
    expect(toggleValue).toHaveBeenCalledWith("courage");
  });

  it("disables the submit button until the hook allows submission", () => {
    screenHook.mockReturnValue(model({ canSubmit: false }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submit-selection-button")).toBeDisabled();
    expect(screen.getByTestId("submit-selection-button")).toHaveTextContent(
      "Submit selection",
    );
  });

  it("hints how many picks are missing beside the submit button", () => {
    screenHook.mockReturnValue(model({ selectedCount: 7, remainingCount: 3 }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("selection-hint")).toHaveTextContent(
      "Pick 3 more",
    );
  });

  it("drops the hint once all ten are picked", () => {
    screenHook.mockReturnValue(
      model({ selectedCount: 10, remainingCount: 0, canSubmit: true }),
    );

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("selection-hint")).not.toBeInTheDocument();
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

  it("confirms the irrevocable submission through the dialog", () => {
    const confirmSubmission = jest.fn();
    screenHook.mockReturnValue(
      model({ isConfirming: true, confirmSubmission }),
    );

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });
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

  it("replaces the whole grid with the submitted confirmation once submitted", () => {
    screenHook.mockReturnValue(model({ isSubmitted: true }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(
      screen.getByTestId("selection-submitted-confirmation"),
    ).toHaveTextContent("Submission successful");
    expect(
      screen.queryByTestId("submit-selection-button"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^value-chip-/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("selected-count")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Pick exactly 10 values"),
    ).not.toBeInTheDocument();
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
    screenHook.mockReturnValue(model({ selectedCount: 7, remainingCount: 3 }));

    render(<ParticipantSelectionScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    screen.getByText("Wähle genau 10 Werte");
    expect(screen.getByTestId("selected-count")).toHaveTextContent(
      "Ausgewählt: 7/10",
    );
    expect(screen.getByTestId("selection-hint")).toHaveTextContent(
      "Noch 3 wählen",
    );
  });
});
