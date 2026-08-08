import { act, renderHook } from "@testing-library/react";
import { NEVER, Subject } from "rxjs";
import { Phase } from "../../domain/phases";
import type { PhasedWorkshopState } from "../../domain/workshopState";
import { usePhaseView } from "../usePhaseView";

describe("phase view state", () => {
  it("has no state before the first one arrives", () => {
    const { result } = renderHook(() =>
      usePhaseView({ workshopState: NEVER, connectionState: NEVER }),
    );

    expect(result.current).toBeNull();
  });

  it("delivers every state the port publishes", () => {
    const workshopState = new Subject<PhasedWorkshopState>();
    const { result } = renderHook(() =>
      usePhaseView({ workshopState, connectionState: NEVER }),
    );

    act(() => workshopState.next({ revision: 1, phase: Phase.Join }));
    expect(result.current).toEqual({ revision: 1, phase: Phase.Join });

    act(() => workshopState.next({ revision: 2, phase: Phase.Quiz }));
    expect(result.current).toEqual({ revision: 2, phase: Phase.Quiz });
  });

  it("stops listening once the caller is gone", () => {
    const workshopState = new Subject<PhasedWorkshopState>();
    const { unmount } = renderHook(() =>
      usePhaseView({ workshopState, connectionState: NEVER }),
    );

    unmount();

    expect(workshopState.observed).toBe(false);
  });
});
