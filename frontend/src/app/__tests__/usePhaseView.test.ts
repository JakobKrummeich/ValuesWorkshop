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

    expect(result.current.state).toBeNull();
    expect(result.current.isPhaseEntryObserved).toBe(false);
  });

  it("delivers every state the port publishes", () => {
    const workshopState = new Subject<PhasedWorkshopState>();
    const { result } = renderHook(() =>
      usePhaseView({ workshopState, connectionState: NEVER }),
    );

    act(() => workshopState.next({ revision: 1, phase: Phase.Join }));
    expect(result.current.state).toEqual({ revision: 1, phase: Phase.Join });

    act(() => workshopState.next({ revision: 2, phase: Phase.Quiz }));
    expect(result.current.state).toEqual({ revision: 2, phase: Phase.Quiz });
  });

  it("counts the phase it starts in as entered before it was watching", () => {
    const workshopState = new Subject<PhasedWorkshopState>();
    const { result } = renderHook(() =>
      usePhaseView({ workshopState, connectionState: NEVER }),
    );

    act(() =>
      workshopState.next({ revision: 30, phase: Phase.GroupFormation }),
    );

    expect(result.current.isPhaseEntryObserved).toBe(false);
  });

  it("counts a phase change it watched as an observed entry", () => {
    const workshopState = new Subject<PhasedWorkshopState>();
    const { result } = renderHook(() =>
      usePhaseView({ workshopState, connectionState: NEVER }),
    );

    act(() =>
      workshopState.next({ revision: 29, phase: Phase.SelectionResults }),
    );
    act(() =>
      workshopState.next({ revision: 30, phase: Phase.GroupFormation }),
    );

    expect(result.current.isPhaseEntryObserved).toBe(true);
  });

  it("does not count a later state of the same phase as another entry", () => {
    const workshopState = new Subject<PhasedWorkshopState>();
    const { result } = renderHook(() =>
      usePhaseView({ workshopState, connectionState: NEVER }),
    );

    act(() =>
      workshopState.next({ revision: 29, phase: Phase.SelectionResults }),
    );
    act(() =>
      workshopState.next({ revision: 30, phase: Phase.GroupFormation }),
    );
    act(() =>
      workshopState.next({ revision: 31, phase: Phase.GroupFormation }),
    );

    expect(result.current.isPhaseEntryObserved).toBe(false);
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
