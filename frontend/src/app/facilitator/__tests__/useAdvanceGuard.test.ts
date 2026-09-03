import { renderHook } from "@testing-library/react";
import { NEVER, of, type Observable } from "rxjs";
import { Language } from "../../../domain/i18n/language";
import { Phase } from "../../../domain/phases";
import {
  FacilitatorIntent,
  type FacilitatorWorkshopState,
} from "../../../domain/workshopState";
import { languageWrapper } from "../../../testing/languageWrapper";
import { useFacilitatorDependencies } from "../dependencies";
import { useAdvanceGuard } from "../useAdvanceGuard";

jest.mock("../dependencies", () => ({
  useFacilitatorDependencies: jest.fn(),
}));

const dependencies = useFacilitatorDependencies as jest.MockedFunction<
  typeof useFacilitatorDependencies
>;

function withWorkshopState(
  workshopState: Observable<FacilitatorWorkshopState>,
) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState, connectionState: NEVER },
    lifecyclePort: { advancePhase: () => NEVER },
    quizControlPort: {
      revealAnswer: () => NEVER,
      showLearningText: () => NEVER,
      poseNextQuestion: () => NEVER,
    },
    groupWorkControlPort: { reassignScribe: () => NEVER },
    walkControlPort: {
      goToNextValue: () => NEVER,
      correctActionWording: () => NEVER,
    },
    votingControlPort: {
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    },
    conclusionControlPort: { revealNextValue: () => NEVER },
  });
}

const joinState: FacilitatorWorkshopState = {
  phase: Phase.Join,
  revision: 1,
  roster: { participants: [], participantCount: 2 },
  enabledIntents: [FacilitatorIntent.AdvancePhase],
};

describe("advance guard", () => {
  it("says nothing before a state has arrived", () => {
    withWorkshopState(NEVER);

    const { result } = renderHook(() => useAdvanceGuard(), {
      wrapper: languageWrapper(),
    });

    expect(result.current.guardText).toBeNull();
  });

  it("speaks the guard of the current phase", () => {
    withWorkshopState(of(joinState));

    const { result } = renderHook(() => useAdvanceGuard(), {
      wrapper: languageWrapper(),
    });

    expect(result.current.guardText).toBe("Advance when everybody is in.");
  });

  it("speaks the chosen language", () => {
    withWorkshopState(of(joinState));

    const { result } = renderHook(() => useAdvanceGuard(), {
      wrapper: languageWrapper(Language.German),
    });

    expect(result.current.guardText).toBe("Weiter, wenn alle da sind.");
  });
});
