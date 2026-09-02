import { Phase } from "../phases";
import { nextPhase, phaseSequence } from "../phaseSequence";

describe("phase sequence", () => {
  it("walks every phase once, from join to the finale", () => {
    const declaredPhases = Object.values(Phase).filter(
      (phase): phase is Phase => typeof phase === "number",
    );

    expect([...phaseSequence]).toEqual(declaredPhases);
    expect(phaseSequence[0]).toBe(Phase.Join);
    expect(phaseSequence.at(-1)).toBe(Phase.FinalPresentation);
  });

  it("names the phase that follows", () => {
    expect(nextPhase(Phase.Join)).toBe(Phase.Quiz);
    expect(nextPhase(Phase.GroupFormation)).toBe(Phase.GroupWork);
  });

  it("has nothing after the finale", () => {
    expect(nextPhase(Phase.FinalPresentation)).toBeNull();
  });
});
