import { render, screen } from "@testing-library/react";
import { ProgressRing } from "../ProgressRing";

describe("progress ring", () => {
  it("fills the ring to the fraction and reads it out as a percentage", () => {
    render(
      <ProgressRing
        fraction={0.42}
        label="Forming groups…"
        testId="formation-progress"
      />,
    );

    const ring = screen.getByRole("progressbar");
    expect(ring).toHaveAccessibleName("Forming groups…");
    expect(ring).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "42%Forming groups…",
    );
    expect(ring.firstElementChild).toHaveStyle({ "--ring-fraction": "0.42" });
  });

  it("starts empty and stands without a label", () => {
    render(<ProgressRing fraction={0} />);

    const ring = screen.getByRole("progressbar");
    expect(ring).toHaveAttribute("aria-valuenow", "0");
    expect(ring).toHaveTextContent("0%");
    expect(ring.querySelector("p")).not.toBeInTheDocument();
  });
});
