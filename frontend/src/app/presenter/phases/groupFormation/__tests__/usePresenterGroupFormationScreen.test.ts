import { act, renderHook } from "@testing-library/react";
import {
  FormationSubState,
  type PresenterFormationView,
  type PresenterGroups,
} from "../../../../../domain/workshopState";
import { groupPageCycleMilliseconds } from "../../../useGroupPages";
import { usePresenterGroupFormationScreen } from "../usePresenterGroupFormationScreen";

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

function formed(groupCount: number): PresenterFormationView {
  return { subState: FormationSubState.Formed, groups: groups(groupCount) };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("presenter group formation screen hook", () => {
  it("pages the formed groups", () => {
    const { result } = renderHook(() =>
      usePresenterGroupFormationScreen(formed(7)),
    );

    expect(result.current.pageIndex).toBe(0);
    expect(result.current.currentPageGroups).toHaveLength(6);
  });

  it("holds every page back while the formation still runs", () => {
    const { result } = renderHook(() =>
      usePresenterGroupFormationScreen({
        subState: FormationSubState.Forming,
        progress: 0.5,
      }),
    );

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

    expect(result.current.pageIndex).toBe(1);
    expect(animalIds(result.current.currentPageGroups)).toEqual(["animal-7"]);
  });
});
