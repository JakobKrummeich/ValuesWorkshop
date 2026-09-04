import { render, screen } from "@testing-library/react";
import { Pips } from "../Pips";

describe("Pips", () => {
  it("draws one pip per slot and fills the first ones", () => {
    render(<Pips filled={2} total={5} testId="pips" />);

    const pips = screen.getByTestId("pips");
    expect(pips.children).toHaveLength(5);
    expect(pips.querySelectorAll('[data-filled="true"]')).toHaveLength(2);
    expect(pips).toHaveAttribute("aria-hidden", "true");
  });
});
