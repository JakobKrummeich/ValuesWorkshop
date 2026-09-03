import { render, screen } from "@testing-library/react";
import { Eyebrow, EyebrowTone } from "../Eyebrow";

describe("eyebrow", () => {
  it("renders its label as a paragraph so it never inherits the heading serif", () => {
    render(<Eyebrow testId="question-heading">Question 1 of 5</Eyebrow>);

    const eyebrow = screen.getByTestId("question-heading");
    expect(eyebrow.tagName).toBe("P");
    expect(eyebrow).toHaveTextContent("Question 1 of 5");
    expect(eyebrow).toHaveClass("eyebrow");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("layers the tone and the caller's class on top of the base class", () => {
    render(
      <Eyebrow tone={EyebrowTone.Animal} className="rise" testId="eyebrow">
        Up next
      </Eyebrow>,
    );

    expect(screen.getByTestId("eyebrow")).toHaveClass(
      "eyebrow",
      "animal",
      "rise",
    );
  });
});
