import { act, renderHook } from "@testing-library/react";
import { motionIsAllowed } from "../../adapters/motionPreference";
import { motionSlowMilliseconds } from "../../shared/motion";
import { useCountUp } from "../useCountUp";

jest.mock("../../adapters/motionPreference", () => ({
  motionIsAllowed: jest.fn(),
}));

const motionAllowed = motionIsAllowed as jest.MockedFunction<
  typeof motionIsAllowed
>;

interface FrameClock {
  advance(milliseconds: number): void;
  pendingFrames(): number;
}

function installFrameClock(): FrameClock {
  let now = 0;
  let nextHandle = 1;
  const frames = new Map<number, FrameRequestCallback>();

  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const handle = nextHandle++;
    frames.set(handle, callback);
    return handle;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((handle) => {
    frames.delete(handle);
  });
  jest.spyOn(performance, "now").mockImplementation(() => now);

  return {
    advance(milliseconds) {
      now += milliseconds;
      const due = [...frames.entries()];
      frames.clear();
      for (const [, callback] of due) {
        callback(now);
      }
    },
    pendingFrames: () => frames.size,
  };
}

describe("useCountUp", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts at the target so the first paint carries the real number", () => {
    motionAllowed.mockReturnValue(true);
    installFrameClock();

    const { result } = renderHook(() => useCountUp(12));

    expect(result.current).toBe(12);
  });

  it("eases from the previous number to the new one over the slow duration", () => {
    motionAllowed.mockReturnValue(true);
    const clock = installFrameClock();
    const { result, rerender } = renderHook(
      (target: number) => useCountUp(target),
      {
        initialProps: 0,
      },
    );

    rerender(100);

    act(() => clock.advance(0));
    expect(result.current).toBe(0);

    act(() => clock.advance(motionSlowMilliseconds / 2));
    expect(result.current).toBeGreaterThan(50);
    expect(result.current).toBeLessThan(100);

    act(() => clock.advance(motionSlowMilliseconds / 2));
    expect(result.current).toBe(100);
    expect(clock.pendingFrames()).toBe(0);
  });

  it("counts down as readily as up", () => {
    motionAllowed.mockReturnValue(true);
    const clock = installFrameClock();
    const { result, rerender } = renderHook(
      (target: number) => useCountUp(target),
      {
        initialProps: 40,
      },
    );

    rerender(10);
    act(() => clock.advance(0));
    act(() => clock.advance(motionSlowMilliseconds / 3));

    expect(result.current).toBeLessThan(40);
    expect(result.current).toBeGreaterThan(10);
  });

  it("retargets mid-flight from the number currently shown", () => {
    motionAllowed.mockReturnValue(true);
    const clock = installFrameClock();
    const { result, rerender } = renderHook(
      (target: number) => useCountUp(target),
      {
        initialProps: 0,
      },
    );

    rerender(100);
    act(() => clock.advance(0));
    act(() => clock.advance(motionSlowMilliseconds / 2));
    const midway = result.current;

    rerender(0);
    act(() => clock.advance(0));
    expect(result.current).toBe(midway);

    act(() => clock.advance(motionSlowMilliseconds));
    expect(result.current).toBe(0);
  });

  it("jumps straight to the target when motion is not allowed", () => {
    motionAllowed.mockReturnValue(false);
    const clock = installFrameClock();
    const { result, rerender } = renderHook(
      (target: number) => useCountUp(target),
      {
        initialProps: 3,
      },
    );

    rerender(30);

    expect(result.current).toBe(30);
    expect(clock.pendingFrames()).toBe(0);
  });

  it("cancels the pending frame when unmounted mid-flight", () => {
    motionAllowed.mockReturnValue(true);
    const clock = installFrameClock();
    const { rerender, unmount } = renderHook(
      (target: number) => useCountUp(target),
      {
        initialProps: 0,
      },
    );

    rerender(100);
    act(() => clock.advance(0));
    expect(clock.pendingFrames()).toBe(1);

    unmount();

    expect(clock.pendingFrames()).toBe(0);
  });
});
