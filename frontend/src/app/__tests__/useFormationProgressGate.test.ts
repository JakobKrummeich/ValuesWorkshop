import { act, renderHook } from "@testing-library/react";
import { useFormationProgressGate } from "../useFormationProgressGate";

function renderGate(isPhaseEntryObserved: boolean) {
  return renderHook(() => useFormationProgressGate(isPhaseEntryObserved));
}

describe("formation progress gate", () => {
  it("holds nothing back when it did not watch the phase begin", () => {
    const { result } = renderGate(false);

    expect(result.current.isFormationProgressRunning).toBe(false);
  });

  it("runs the progress bar when it watched the phase begin", () => {
    const { result } = renderGate(true);

    expect(result.current.isFormationProgressRunning).toBe(true);
  });

  it("opens once the progress bar reports it is done", () => {
    const { result } = renderGate(true);

    act(() => result.current.completeFormationProgress());

    expect(result.current.isFormationProgressRunning).toBe(false);
  });

  it("stays open across later states of the same phase", () => {
    const { result, rerender } = renderGate(true);

    act(() => result.current.completeFormationProgress());
    rerender();

    expect(result.current.isFormationProgressRunning).toBe(false);
  });
});
