import { act, renderHook } from "@testing-library/react";
import type { PresenterGroupFormationState } from "../../../../../domain/workshopState";
import {
  groupPageCycleMilliseconds,
  usePresenterGroupFormationScreen,
} from "../usePresenterGroupFormationScreen";

type PresenterGroups = PresenterGroupFormationState["groups"];

function groups(count: number): PresenterGroups {
  return Array.from({ length: count }, (unused, index) => ({
    name: {
      animalId: `animal-${index + 1}`,
      text: { de: `Tier ${index + 1}`, en: `Animal ${index + 1}` },
    },
    memberDisplayNames: ["Ada"],
    assignedValues: [],
  }));
}

function animalIds(page: PresenterGroups): string[] {
  return page.map((group) => group.name.animalId);
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("presenter group formation screen hook", () => {
  it("shows every group without cycling when they fit one page", () => {
    const { result } = renderHook(() =>
      usePresenterGroupFormationScreen(groups(6)),
    );

    expect(result.current.currentPageGroups).toHaveLength(6);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("shows no groups when none exist", () => {
    const { result } = renderHook(() =>
      usePresenterGroupFormationScreen(groups(0)),
    );

    expect(result.current.currentPageGroups).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("advances to the next page after the cycle interval", () => {
    const { result } = renderHook(() =>
      usePresenterGroupFormationScreen(groups(7)),
    );

    expect(animalIds(result.current.currentPageGroups)).toEqual([
      "animal-1",
      "animal-2",
      "animal-3",
      "animal-4",
      "animal-5",
      "animal-6",
    ]);

    act(() => jest.advanceTimersByTime(groupPageCycleMilliseconds));

    expect(animalIds(result.current.currentPageGroups)).toEqual(["animal-7"]);
  });

  it("wraps around to the first page after the last one", () => {
    const { result } = renderHook(() =>
      usePresenterGroupFormationScreen(groups(7)),
    );

    act(() => jest.advanceTimersByTime(2 * groupPageCycleMilliseconds));

    expect(animalIds(result.current.currentPageGroups)).toEqual([
      "animal-1",
      "animal-2",
      "animal-3",
      "animal-4",
      "animal-5",
      "animal-6",
    ]);
  });

  it("clears the cycle timer on unmount", () => {
    const { unmount } = renderHook(() =>
      usePresenterGroupFormationScreen(groups(7)),
    );

    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
