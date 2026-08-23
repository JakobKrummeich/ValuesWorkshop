import { act, renderHook } from "@testing-library/react";
import {
  FormationSubState,
  type PresenterFormationView,
  type PresenterGroups,
} from "../../../../../domain/workshopState";
import {
  groupPageCycleMilliseconds,
  usePresenterGroupFormationScreen,
} from "../usePresenterGroupFormationScreen";

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

function renderScreenHook(formation: PresenterFormationView) {
  return renderHook(() => usePresenterGroupFormationScreen(formation));
}

function formed(groupCount: number): PresenterFormationView {
  return { subState: FormationSubState.Formed, groups: groups(groupCount) };
}

describe("presenter group formation screen hook", () => {
  it("shows every group without cycling when they fit one page", () => {
    const { result } = renderScreenHook(formed(6));

    expect(result.current.currentPageGroups).toHaveLength(6);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("shows no groups when none exist", () => {
    const { result } = renderScreenHook(formed(0));

    expect(result.current.currentPageGroups).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("advances to the next page after the cycle interval", () => {
    const { result } = renderScreenHook(formed(7));

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
    const { result } = renderScreenHook(formed(7));

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
    const { unmount } = renderScreenHook(formed(7));

    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });

  it("holds every page back while the formation still runs", () => {
    const { result } = renderScreenHook({
      subState: FormationSubState.Forming,
      progress: 0.5,
    });

    expect(result.current.currentPageGroups).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("starts cycling once the groups are formed", () => {
    const { rerender, result } = renderHook(
      (formation: PresenterFormationView) =>
        usePresenterGroupFormationScreen(formation),
      { initialProps: { subState: FormationSubState.Forming, progress: 0.9 } },
    );

    expect(jest.getTimerCount()).toBe(0);

    rerender(formed(7));

    act(() => jest.advanceTimersByTime(groupPageCycleMilliseconds));

    expect(animalIds(result.current.currentPageGroups)).toEqual(["animal-7"]);
  });
});
