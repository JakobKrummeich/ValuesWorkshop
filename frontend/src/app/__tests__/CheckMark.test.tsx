import { render } from "@testing-library/react";
import { CheckMark } from "../CheckMark";

describe("check mark", () => {
  it("is decorative and carries the caller's class next to its own", () => {
    const { container } = render(<CheckMark className="pop" />);

    const mark = container.querySelector("svg");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveClass("check", "pop");
  });
});
