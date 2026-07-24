import { PHASES } from "../phases";

describe("workshop phases", () => {
  it("lists the nine phases in fixed forward order", () => {
    expect(PHASES).toEqual([
      "join",
      "quiz",
      "valueSelection",
      "selectionResults",
      "groupFormation",
      "groupWork",
      "valuePresentation",
      "finalVoting",
      "finalPresentation",
    ]);
  });
});
