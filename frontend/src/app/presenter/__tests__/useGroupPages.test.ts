import { act, renderHook } from "@testing-library/react";
import { groupPageCycleMilliseconds, useGroupPages } from "../useGroupPages";

function groups(count: number): string[] {
  return Array.from(
    { length: count },
    (unused, index) => `animal-${index + 1}`,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("group pages", () => {
  it("shows every group on the first page without cycling when they fit", () => {
    const { result } = renderHook(() => useGroupPages(groups(6)));

    expect(result.current).toEqual({
      pageIndex: 0,
      currentPageGroups: groups(6),
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it("shows an empty page without groups", () => {
    const { result } = renderHook(() => useGroupPages([]));

    expect(result.current).toEqual({ pageIndex: 0, currentPageGroups: [] });
    expect(jest.getTimerCount()).toBe(0);
  });

  it("advances to the next page after the cycle interval", () => {
    const { result } = renderHook(() => useGroupPages(groups(7)));

    act(() => jest.advanceTimersByTime(groupPageCycleMilliseconds));

    expect(result.current).toEqual({
      pageIndex: 1,
      currentPageGroups: ["animal-7"],
    });
  });

  it("wraps around to the first page after the last one", () => {
    const { result } = renderHook(() => useGroupPages(groups(7)));

    act(() => jest.advanceTimersByTime(2 * groupPageCycleMilliseconds));

    expect(result.current.pageIndex).toBe(0);
    expect(result.current.currentPageGroups).toHaveLength(6);
  });

  it("clears the cycle timer on unmount", () => {
    const { unmount } = renderHook(() => useGroupPages(groups(7)));

    expect(jest.getTimerCount()).toBe(1);
    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });

  it("starts cycling once the groups grow beyond one page", () => {
    const { result, rerender } = renderHook(
      ({ animals }) => useGroupPages(animals),
      { initialProps: { animals: groups(3) } },
    );

    expect(jest.getTimerCount()).toBe(0);
    rerender({ animals: groups(8) });
    act(() => jest.advanceTimersByTime(groupPageCycleMilliseconds));

    expect(result.current.currentPageGroups).toEqual(["animal-7", "animal-8"]);
  });
});
