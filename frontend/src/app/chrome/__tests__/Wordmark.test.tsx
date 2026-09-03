import { render, screen } from "@testing-library/react";
import { Wordmark, WordmarkSize } from "../Wordmark";

describe("wordmark", () => {
  it("spells the product name next to a decorative mark", () => {
    const { container } = render(<Wordmark size={WordmarkSize.Compact} />);

    expect(screen.getByText("Values Workshop")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
