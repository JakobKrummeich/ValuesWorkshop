import { render, screen } from "@testing-library/react";
import { AdvanceGuard } from "../AdvanceGuard";
import { useAdvanceGuard } from "../useAdvanceGuard";

jest.mock("../useAdvanceGuard", () => ({
  useAdvanceGuard: jest.fn(),
}));

const guard = useAdvanceGuard as jest.MockedFunction<typeof useAdvanceGuard>;

describe("advance guard", () => {
  it("shows the guard text", () => {
    guard.mockReturnValue({ guardText: "Advance when everybody is in." });

    render(<AdvanceGuard />);

    expect(screen.getByTestId("advance-guard")).toHaveTextContent(
      "Advance when everybody is in.",
    );
  });

  it("renders nothing without a guard", () => {
    guard.mockReturnValue({ guardText: null });

    const { container } = render(<AdvanceGuard />);

    expect(container).toBeEmptyDOMElement();
  });
});
