import { render, screen } from "@testing-library/react";
import { Counter, CounterSize, CounterVariant } from "../Counter";
import { useCountUp } from "../useCountUp";

jest.mock("../useCountUp", () => ({ useCountUp: jest.fn() }));

const countUp = useCountUp as jest.MockedFunction<typeof useCountUp>;

describe("counter", () => {
  it("shows the animated number the hook hands it, with the eyebrow suffix", () => {
    countUp.mockReturnValue(7);

    render(
      <Counter
        value={12}
        suffix="of 30 joined"
        variant={CounterVariant.Wall}
        size={CounterSize.Giant}
        testId="participant-count"
      />,
    );

    expect(countUp).toHaveBeenCalledWith(12);
    expect(screen.getByTestId("participant-count")).toHaveTextContent(
      "7 of 30 joined",
    );
    expect(screen.getByText("of 30 joined")).toBeInTheDocument();
  });

  it("stands alone without a suffix", () => {
    countUp.mockReturnValue(3);

    const { container } = render(
      <Counter
        value={3}
        variant={CounterVariant.Phone}
        size={CounterSize.Display}
      />,
    );

    expect(container).toHaveTextContent("3");
    expect(container.querySelectorAll("span")).toHaveLength(1);
  });
});
