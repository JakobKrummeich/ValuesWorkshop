import { fireEvent, render, screen } from "@testing-library/react";
import { MessageKey } from "../../../domain/i18n/messages";
import { languageWrapper } from "../../../testing/languageWrapper";
import { AdvancePhaseButton } from "../AdvancePhaseButton";
import { useAdvancePhaseButton } from "../useAdvancePhaseButton";

jest.mock("../useAdvancePhaseButton", () => ({
  useAdvancePhaseButton: jest.fn(),
}));

const button = useAdvancePhaseButton as jest.MockedFunction<
  typeof useAdvancePhaseButton
>;

describe("advance phase button", () => {
  it("asks the hook to advance when pressed", () => {
    const advancePhase = jest.fn();
    button.mockReturnValue({
      isAdvancing: false,
      isAdvanceEnabled: true,
      rejectionMessage: null,
      advancePhase,
    });
    render(<AdvancePhaseButton />, { wrapper: languageWrapper() });

    fireEvent.click(screen.getByRole("button", { name: "Advance phase" }));

    expect(advancePhase).toHaveBeenCalled();
  });

  it("is disabled while an intent is in flight", () => {
    button.mockReturnValue({
      isAdvancing: true,
      isAdvanceEnabled: true,
      rejectionMessage: null,
      advancePhase: jest.fn(),
    });

    render(<AdvancePhaseButton />, { wrapper: languageWrapper() });

    expect(
      screen.getByRole("button", { name: "Advance phase" }),
    ).toBeDisabled();
  });

  it("is disabled while the workshop does not allow advancing", () => {
    button.mockReturnValue({
      isAdvancing: false,
      isAdvanceEnabled: false,
      rejectionMessage: null,
      advancePhase: jest.fn(),
    });

    render(<AdvancePhaseButton />, { wrapper: languageWrapper() });

    expect(
      screen.getByRole("button", { name: "Advance phase" }),
    ).toBeDisabled();
  });

  it("shows the rejection message", () => {
    button.mockReturnValue({
      isAdvancing: false,
      isAdvanceEnabled: true,
      rejectionMessage: MessageKey.IntentWrongPhase,
      advancePhase: jest.fn(),
    });

    render(<AdvancePhaseButton />, { wrapper: languageWrapper() });

    screen.getByText("That is not possible in this phase.");
  });
});
