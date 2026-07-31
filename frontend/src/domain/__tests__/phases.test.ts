import { Phase } from "../phases";

describe("workshop phases", () => {
  it("numbers the nine phases in fixed forward order", () => {
    expect([
      Phase.Join,
      Phase.Quiz,
      Phase.ValueSelection,
      Phase.SelectionResults,
      Phase.GroupFormation,
      Phase.GroupWork,
      Phase.ValuePresentation,
      Phase.FinalVoting,
      Phase.FinalPresentation,
    ]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
