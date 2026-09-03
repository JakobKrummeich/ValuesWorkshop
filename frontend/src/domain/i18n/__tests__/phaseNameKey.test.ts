import { Phase } from "../../phases";
import { phaseNameKey } from "../phaseNameKey";
import { Language } from "../language";
import { MessageKey } from "../messages";
import { translate } from "../translate";

describe("phase names", () => {
  it("names every phase with its own key", () => {
    const keys = Object.values(Phase)
      .filter((phase): phase is Phase => typeof phase === "number")
      .map(phaseNameKey);

    expect(new Set(keys).size).toBe(9);
    expect(keys[0]).toBe(MessageKey.PhaseNameJoin);
    expect(keys[8]).toBe(MessageKey.PhaseNameFinalPresentation);
  });

  it("reads as the short chrome label in both languages", () => {
    expect(translate(Language.English, phaseNameKey(Phase.GroupWork))).toBe(
      "Group work",
    );
    expect(translate(Language.German, phaseNameKey(Phase.GroupWork))).toBe(
      "Gruppenarbeit",
    );
  });
});
