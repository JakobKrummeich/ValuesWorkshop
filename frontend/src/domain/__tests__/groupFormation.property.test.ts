import fc from "fast-check";
import { splitIntoGroupPages } from "../groupFormation";

const groupPageCapacity = 6;

const groupLists = fc.array(fc.integer({ min: 0, max: 999 }), {
  maxLength: 40,
});

describe("the group pages, for any number of groups", () => {
  it("hand every group out once, in the order they came", () => {
    fc.assert(
      fc.property(groupLists, (groups) => {
        expect(splitIntoGroupPages(groups).flat()).toEqual(groups);
      }),
    );
  });

  it("hold at most a page full and never stand empty", () => {
    fc.assert(
      fc.property(groupLists, (groups) => {
        const pages = splitIntoGroupPages(groups);

        expect(
          pages.every(
            (page) => page.length > 0 && page.length <= groupPageCapacity,
          ),
        ).toBe(true);
      }),
    );
  });

  it("are as few as the capacity allows", () => {
    fc.assert(
      fc.property(groupLists, (groups) => {
        expect(splitIntoGroupPages(groups).length).toBe(
          Math.ceil(groups.length / groupPageCapacity),
        );
      }),
    );
  });
});
