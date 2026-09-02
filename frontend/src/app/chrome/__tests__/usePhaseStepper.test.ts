import { renderHook } from "@testing-library/react";
import { Language } from "../../../domain/i18n/language";
import { Phase } from "../../../domain/phases";
import { languageWrapper } from "../../../testing/languageWrapper";
import { PhaseStepState, usePhaseStepper } from "../usePhaseStepper";

describe("phase stepper logic", () => {
  it("lists all nine phases in order with their short names", () => {
    const { result } = renderHook(() => usePhaseStepper(Phase.Join), {
      wrapper: languageWrapper(),
    });

    expect(result.current.steps.map((step) => step.name)).toEqual([
      "Join",
      "Quiz",
      "Selection",
      "Results",
      "Groups",
      "Group work",
      "Presentations",
      "Vote",
      "Finale",
    ]);
    expect(result.current.steps.map((step) => step.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(result.current.label).toBe("Workshop phases");
  });

  it("marks earlier phases done, the live one current and the rest upcoming", () => {
    const { result } = renderHook(() => usePhaseStepper(Phase.ValueSelection), {
      wrapper: languageWrapper(),
    });

    expect(result.current.steps.map((step) => step.state)).toEqual([
      PhaseStepState.Done,
      PhaseStepState.Done,
      PhaseStepState.Current,
      ...Array<PhaseStepState>(6).fill(PhaseStepState.Upcoming),
    ]);
    expect(result.current.currentLabel).toBe("Phase 3");
    expect(result.current.currentName).toBe("Selection");
  });

  it("waits for the workshop while no phase is known", () => {
    const { result } = renderHook(() => usePhaseStepper(null), {
      wrapper: languageWrapper(),
    });

    expect(
      result.current.steps.every(
        (step) => step.state === PhaseStepState.Upcoming,
      ),
    ).toBe(true);
    expect(result.current.currentLabel).toBe("Waiting for the workshop\u2026");
    expect(result.current.currentName).toBeNull();
  });

  it("speaks the chosen language", () => {
    const { result } = renderHook(() => usePhaseStepper(Phase.GroupWork), {
      wrapper: languageWrapper(Language.German),
    });

    expect(result.current.currentName).toBe("Gruppenarbeit");
    expect(result.current.label).toBe("Workshop-Phasen");
  });
});
