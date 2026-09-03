import { render, screen } from "@testing-library/react";
import { Phase } from "../../../domain/phases";
import { PhaseStepper, PhaseStepperVariant } from "../PhaseStepper";
import { PhaseStepState, usePhaseStepper } from "../usePhaseStepper";

jest.mock("../usePhaseStepper", () => ({
  ...jest.requireActual("../usePhaseStepper"),
  usePhaseStepper: jest.fn(),
}));

const stepper = jest.mocked(usePhaseStepper);

const threeSteps = [
  { phase: Phase.Join, number: 1, name: "Join", state: PhaseStepState.Done },
  {
    phase: Phase.Quiz,
    number: 2,
    name: "Quiz",
    state: PhaseStepState.Current,
  },
  {
    phase: Phase.ValueSelection,
    number: 3,
    name: "Selection",
    state: PhaseStepState.Upcoming,
  },
];

describe("phase stepper", () => {
  beforeEach(() => {
    stepper.mockReturnValue({
      label: "Workshop phases",
      steps: threeSteps,
      currentLabel: "Phase 2",
      currentName: "Quiz",
    });
  });

  it.each(Object.values(PhaseStepperVariant))(
    "renders the phase contract and the live step as %s",
    (variant) => {
      render(<PhaseStepper currentPhase={Phase.Quiz} variant={variant} />);

      expect(screen.getByTestId("phase")).toHaveTextContent(/^Phase 2$/);
      expect(
        screen.getByRole("navigation", { name: "Workshop phases" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
      expect(screen.getByText("Quiz", { selector: "li *" })).toBeVisible();
      expect(
        screen.getByRole("listitem", { current: "step" }),
      ).toHaveTextContent("Quiz");
    },
  );

  it("shows the waiting text alone while no phase is known", () => {
    stepper.mockReturnValue({
      label: "Workshop phases",
      steps: threeSteps.map((step) => ({
        ...step,
        state: PhaseStepState.Upcoming,
      })),
      currentLabel: "Waiting for the workshop\u2026",
      currentName: null,
    });

    render(
      <PhaseStepper currentPhase={null} variant={PhaseStepperVariant.Wall} />,
    );

    expect(screen.getByTestId("phase")).toHaveTextContent(
      "Waiting for the workshop\u2026",
    );
    expect(screen.queryByRole("listitem", { current: "step" })).toBeNull();
  });

  it("draws check marks and numbers only on the sidebar timeline", () => {
    const { container, rerender } = render(
      <PhaseStepper
        currentPhase={Phase.Quiz}
        variant={PhaseStepperVariant.Sidebar}
      />,
    );

    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(screen.getByText("2")).toBeInTheDocument();

    rerender(
      <PhaseStepper
        currentPhase={Phase.Quiz}
        variant={PhaseStepperVariant.Wall}
      />,
    );

    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });
});
