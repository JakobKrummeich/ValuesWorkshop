import { render, screen } from "@testing-library/react";
import { ScreenCopy } from "../ScreenCopy";

describe("screen copy", () => {
  it("shows the heading with its body line", () => {
    render(
      <ScreenCopy
        heading="Eyes up front"
        body="The results are on the screen."
      />,
    );

    expect(screen.getByRole("heading")).toHaveTextContent("Eyes up front");
    expect(
      screen.getByText("The results are on the screen."),
    ).toBeInTheDocument();
  });

  it("stands with the heading alone", () => {
    const { container } = render(<ScreenCopy heading="Your group is up!" />);

    expect(container.querySelector("p")).not.toBeInTheDocument();
  });
});
