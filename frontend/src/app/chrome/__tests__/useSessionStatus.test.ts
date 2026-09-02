import { renderHook, act } from "@testing-library/react";
import { Subject } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Phase } from "../../../domain/phases";
import type { PhasedWorkshopState } from "../../../domain/workshopState";
import { useSessionStatus } from "../useSessionStatus";

function fakePort() {
  const workshopState = new Subject<PhasedWorkshopState>();
  const connectionState = new Subject<ConnectionState>();

  return {
    port: { workshopState, connectionState },
    workshopState,
    connectionState,
  };
}

describe("session status", () => {
  it("starts out connecting and without a phase", () => {
    const { port } = fakePort();

    const { result } = renderHook(() => useSessionStatus(port));

    expect(result.current).toEqual({
      connectionState: ConnectionState.Connecting,
      phase: null,
    });
  });

  it("follows the phase of the latest workshop state", () => {
    const { port, workshopState } = fakePort();
    const { result } = renderHook(() => useSessionStatus(port));

    act(() => workshopState.next({ revision: 1, phase: Phase.Quiz }));

    expect(result.current.phase).toBe(Phase.Quiz);
  });

  it("follows the connection state", () => {
    const { port, connectionState } = fakePort();
    const { result } = renderHook(() => useSessionStatus(port));

    act(() => connectionState.next(ConnectionState.Reconnecting));

    expect(result.current.connectionState).toBe(ConnectionState.Reconnecting);
  });

  it("stops listening when the screen is left", () => {
    const { port, workshopState, connectionState } = fakePort();
    const { unmount } = renderHook(() => useSessionStatus(port));

    unmount();

    expect(workshopState.observed).toBe(false);
    expect(connectionState.observed).toBe(false);
  });
});
