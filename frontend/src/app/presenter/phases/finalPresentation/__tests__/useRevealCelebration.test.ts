import { act, renderHook } from "@testing-library/react";
import {
  motionRevealMilliseconds,
  motionStaggerMilliseconds,
} from "../../../../../shared/motion";
import { useRevealCelebration } from "../useRevealCelebration";

function stubMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches: reducedMotion, media: query }),
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe("reveal celebration", () => {
  it("bursts once the last slab has slid in", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useRevealCelebration(5));

    expect(result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(
        5 * motionStaggerMilliseconds + motionRevealMilliseconds - 1,
      );
    });
    expect(result.current).toBe(false);

    act(() => jest.advanceTimersByTime(1));

    expect(result.current).toBe(true);
  });

  it("never bursts for a viewer who prefers reduced motion", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useRevealCelebration(5));

    act(() => jest.advanceTimersByTime(10_000));

    expect(result.current).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("drops the pending burst on unmount", () => {
    stubMatchMedia(false);
    const { unmount } = renderHook(() => useRevealCelebration(2));

    expect(jest.getTimerCount()).toBe(1);
    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
