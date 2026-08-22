import { act, renderHook } from "@testing-library/react";
import { useParticipantGroupFormationScreen } from "../useParticipantGroupFormationScreen";

describe("participant group formation screen hook", () => {
  it("shows the group right away when it did not watch the phase begin", () => {
    const { result } = renderHook(() =>
      useParticipantGroupFormationScreen(false),
    );

    expect(result.current.isFormationProgressRunning).toBe(false);
  });

  it("runs the progress bar when it watched the phase begin", () => {
    const { result } = renderHook(() =>
      useParticipantGroupFormationScreen(true),
    );

    expect(result.current.isFormationProgressRunning).toBe(true);
  });

  it("shows the group once the progress bar is done", () => {
    const { result } = renderHook(() =>
      useParticipantGroupFormationScreen(true),
    );

    act(() => result.current.completeFormationProgress());

    expect(result.current.isFormationProgressRunning).toBe(false);
  });

  it("keeps the group visible across later states of the same phase", () => {
    const { result, rerender } = renderHook(
      ({ isPhaseEntryObserved }: { isPhaseEntryObserved: boolean }) =>
        useParticipantGroupFormationScreen(isPhaseEntryObserved),
      { initialProps: { isPhaseEntryObserved: true } },
    );

    act(() => result.current.completeFormationProgress());
    rerender({ isPhaseEntryObserved: false });

    expect(result.current.isFormationProgressRunning).toBe(false);
  });

  it("keeps the progress bar running across later states of the same phase", () => {
    const { result, rerender } = renderHook(
      ({ isPhaseEntryObserved }: { isPhaseEntryObserved: boolean }) =>
        useParticipantGroupFormationScreen(isPhaseEntryObserved),
      { initialProps: { isPhaseEntryObserved: true } },
    );

    rerender({ isPhaseEntryObserved: false });

    expect(result.current.isFormationProgressRunning).toBe(true);
  });
});
