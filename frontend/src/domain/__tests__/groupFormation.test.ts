import { splitIntoGroupPages } from "../groupFormation";

function groups(count: number): string[] {
  return Array.from({ length: count }, (unused, index) => `group-${index + 1}`);
}

describe("group pages", () => {
  it("has no pages when there are no groups", () => {
    expect(splitIntoGroupPages([])).toEqual([]);
  });

  it("keeps up to six groups on a single page", () => {
    expect(splitIntoGroupPages(groups(6))).toEqual([groups(6)]);
  });

  it("moves the seventh group onto a second page", () => {
    expect(splitIntoGroupPages(groups(7))).toEqual([groups(6), ["group-7"]]);
  });

  it("keeps the group order across pages", () => {
    expect(splitIntoGroupPages(groups(13))).toEqual([
      groups(6),
      ["group-7", "group-8", "group-9", "group-10", "group-11", "group-12"],
      ["group-13"],
    ]);
  });
});
