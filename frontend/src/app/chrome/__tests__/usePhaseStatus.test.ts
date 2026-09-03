import { renderHook, act } from "@testing-library/react";
import { Subject } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Phase } from "../../../domain/phases";
import type { PhasedWorkshopState } from "../../../domain/workshopState";
import { usePhaseStatus } from "../usePhaseStatus";

function fakePort() {
  const workshopState = new Subject<PhasedWorkshopState>();
  const connectionState = new Subject<ConnectionState>();

  return {
    port: { workshopState, connectionState },
    workshopState,
    connectionState,
  };
}

describe("phase status", () => {
  it("has no phase before any workshop state has arrived", () => {
    const { port } = fakePort();

    const { result } = renderHook(() => usePhaseStatus(port));

    expect(result.current).toBeNull();
  });

  it("follows the phase of the latest workshop state", () => {
    const { port, workshopState } = fakePort();
    const { result } = renderHook(() => usePhaseStatus(port));

    act(() => workshopState.next({ revision: 1, phase: Phase.Quiz }));
    act(() => workshopState.next({ revision: 2, phase: Phase.GroupWork }));

    expect(result.current).toBe(Phase.GroupWork);
  });

  it("stops listening when the screen is left", () => {
    const { port, workshopState } = fakePort();
    const { unmount } = renderHook(() => usePhaseStatus(port));

    unmount();

    expect(workshopState.observed).toBe(false);
  });
});
