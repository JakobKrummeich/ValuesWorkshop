import { render } from "@testing-library/react";
import { Confetti } from "../Confetti";
import { useConfetti } from "../useConfetti";

jest.mock("../useConfetti", () => ({ useConfetti: jest.fn() }));

const confetti = useConfetti as jest.MockedFunction<typeof useConfetti>;

describe("confetti", () => {
  it("drops one hidden particle per generated entry with its motion variables", () => {
    confetti.mockReturnValue([
      { id: 0, x: 12, delay: 0.3, drift: -2, spin: 3, hue: 4 },
      { id: 1, x: 80, delay: 0, drift: 1, spin: 1, hue: 8 },
    ]);

    const { container } = render(<Confetti />);

    expect(confetti).toHaveBeenCalledWith(60);
    const burst = container.firstElementChild;
    expect(burst).toHaveAttribute("aria-hidden", "true");
    const particles = container.querySelectorAll("span");
    expect(particles).toHaveLength(2);
    expect(particles[0]).toHaveAttribute("data-hue", "4");
    expect(particles[0]).toHaveStyle({
      "--x": "12",
      "--delay": "0.3",
      "--drift": "-2",
      "--spin": "3",
    });
    expect(particles[1]).toHaveAttribute("data-hue", "8");
  });
});
