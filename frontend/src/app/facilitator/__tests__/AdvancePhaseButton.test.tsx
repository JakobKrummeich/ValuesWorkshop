import { fireEvent, render, screen } from "@testing-library/react";
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
      rejectionDetail: null,
      advancePhase,
    });
    render(<AdvancePhaseButton />);

    fireEvent.click(screen.getByRole("button", { name: "Advance phase" }));

    expect(advancePhase).toHaveBeenCalled();
  });

  it("is disabled while an intent is in flight", () => {
    button.mockReturnValue({
      isAdvancing: true,
      rejectionDetail: null,
      advancePhase: jest.fn(),
    });

    render(<AdvancePhaseButton />);

    expect(
      screen.getByRole("button", { name: "Advance phase" }),
    ).toBeDisabled();
  });

  it("shows the rejection detail", () => {
    button.mockReturnValue({
      isAdvancing: false,
      rejectionDetail: "the workshop is already in its last phase",
      advancePhase: jest.fn(),
    });

    render(<AdvancePhaseButton />);

    screen.getByText("the workshop is already in its last phase");
  });
});
