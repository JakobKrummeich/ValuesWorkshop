import { act, renderHook } from "@testing-library/react";
import {
  formationProgressMilliseconds,
  useFormationProgressGate,
} from "../useFormationProgressGate";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderGate(isPhaseEntryObserved: boolean) {
  return renderHook(() => useFormationProgressGate(isPhaseEntryObserved));
}

describe("formation progress gate", () => {
  it("runs for three seconds", () => {
    expect(formationProgressMilliseconds).toBe(3000);
  });

  it("holds nothing back when it did not watch the phase begin", () => {
    const { result } = renderGate(false);

    expect(result.current.isFormationProgressRunning).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("runs the progress bar when it watched the phase begin", () => {
    const { result } = renderGate(true);

    expect(result.current.isFormationProgressRunning).toBe(true);
  });

  it("keeps running until the last moment of the three seconds", () => {
    const { result } = renderGate(true);

    act(() => jest.advanceTimersByTime(formationProgressMilliseconds - 1));

    expect(result.current.isFormationProgressRunning).toBe(true);
  });

  it("opens once the three seconds are over", () => {
    const { result } = renderGate(true);

    act(() => jest.advanceTimersByTime(formationProgressMilliseconds));

    expect(result.current.isFormationProgressRunning).toBe(false);
  });

  it("stays open across later states of the same phase", () => {
    const { result, rerender } = renderGate(true);

    act(() => jest.advanceTimersByTime(formationProgressMilliseconds));
    rerender();
    act(() => jest.advanceTimersByTime(10 * formationProgressMilliseconds));

    expect(result.current.isFormationProgressRunning).toBe(false);
  });

  it("stops the run when the screen leaves", () => {
    const { unmount } = renderGate(true);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
