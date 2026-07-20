import type { Clock } from "./clock";

describe("Clock port", () => {
  it("is satisfiable by a fixed test double", () => {
    const fixed: Clock = { now: () => new Date(0) };

    expect(fixed.now().getTime()).toBe(0);
  });
});
