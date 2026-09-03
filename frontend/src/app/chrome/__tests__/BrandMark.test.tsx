import { render } from "@testing-library/react";
import { BrandMark } from "../BrandMark";

describe("brand mark", () => {
  it("is a decorative ember leaf", () => {
    const { container } = render(<BrandMark />);

    const mark = container.querySelector("svg");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveAttribute("viewBox", "0 0 24 24");
    expect(container.querySelector("path")).toHaveAttribute(
      "fill",
      "currentColor",
    );
  });
});
