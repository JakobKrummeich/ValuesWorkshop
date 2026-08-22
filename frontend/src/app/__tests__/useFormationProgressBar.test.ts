import { act, renderHook } from "@testing-library/react";
import {
  formationProgressMilliseconds,
  useFormationProgressBar,
} from "../useFormationProgressBar";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("formation progress bar hook", () => {
  it("runs for three seconds", () => {
    expect(formationProgressMilliseconds).toBe(3000);
  });

  it("keeps the caller waiting until the run is over", () => {
    const onProgressComplete = jest.fn();
    renderHook(() => useFormationProgressBar(onProgressComplete));

    act(() => jest.advanceTimersByTime(formationProgressMilliseconds - 1));

    expect(onProgressComplete).not.toHaveBeenCalled();
  });

  it("reports completion once the run is over", () => {
    const onProgressComplete = jest.fn();
    renderHook(() => useFormationProgressBar(onProgressComplete));

    act(() => jest.advanceTimersByTime(formationProgressMilliseconds));

    expect(onProgressComplete).toHaveBeenCalledTimes(1);
  });

  it("reports completion exactly once", () => {
    const onProgressComplete = jest.fn();
    renderHook(() => useFormationProgressBar(onProgressComplete));

    act(() => jest.advanceTimersByTime(10 * formationProgressMilliseconds));

    expect(onProgressComplete).toHaveBeenCalledTimes(1);
  });

  it("keeps the same run going across re-renders", () => {
    const onProgressComplete = jest.fn();
    const { rerender } = renderHook(() =>
      useFormationProgressBar(onProgressComplete),
    );

    act(() => jest.advanceTimersByTime(formationProgressMilliseconds - 1));
    rerender();
    act(() => jest.advanceTimersByTime(1));

    expect(onProgressComplete).toHaveBeenCalledTimes(1);
  });

  it("stops the run when the bar leaves the screen", () => {
    const onProgressComplete = jest.fn();
    const { unmount } = renderHook(() =>
      useFormationProgressBar(onProgressComplete),
    );

    unmount();

    expect(jest.getTimerCount()).toBe(0);

    act(() => jest.advanceTimersByTime(formationProgressMilliseconds));

    expect(onProgressComplete).not.toHaveBeenCalled();
  });

  it("starts a fresh run when the caller swaps the completion callback", () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();
    const { rerender } = renderHook(
      ({ onProgressComplete }: { onProgressComplete: () => void }) =>
        useFormationProgressBar(onProgressComplete),
      { initialProps: { onProgressComplete: firstCallback } },
    );

    rerender({ onProgressComplete: secondCallback });
    act(() => jest.advanceTimersByTime(formationProgressMilliseconds));

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });
});
