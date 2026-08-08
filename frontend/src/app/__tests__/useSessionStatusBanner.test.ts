import { renderHook, act } from "@testing-library/react";
import { Subject } from "rxjs";
import { ConnectionState } from "../../domain/connectionState";
import { Phase } from "../../domain/phases";
import type { PhasedWorkshopState } from "../../domain/workshopState";
import { languageWrapper } from "../../testing/languageWrapper";
import { useSessionStatusBanner } from "../useSessionStatusBanner";

function fakePort() {
  const workshopState = new Subject<PhasedWorkshopState>();
  const connectionState = new Subject<ConnectionState>();

  return {
    port: { workshopState, connectionState },
    workshopState,
    connectionState,
  };
}

describe("session status banner logic", () => {
  it("starts out connecting and without a phase", () => {
    const { port } = fakePort();

    const { result } = renderHook(() => useSessionStatusBanner(port), {
      wrapper: languageWrapper(),
    });

    expect(result.current).toEqual({
      connectionText: "Connecting",
      phaseText: "Waiting for the workshop\u2026",
    });
  });

  it("follows the phase of the latest workshop state", () => {
    const { port, workshopState } = fakePort();
    const { result } = renderHook(() => useSessionStatusBanner(port), {
      wrapper: languageWrapper(),
    });

    act(() => workshopState.next({ revision: 1, phase: Phase.Quiz }));

    expect(result.current.phaseText).toBe("Phase 2");
  });

  it("follows the connection state", () => {
    const { port, connectionState } = fakePort();
    const { result } = renderHook(() => useSessionStatusBanner(port), {
      wrapper: languageWrapper(),
    });

    act(() => connectionState.next(ConnectionState.Reconnecting));

    expect(result.current.connectionText).toBe("Reconnecting");
  });

  it("stops listening when the screen is left", () => {
    const { port, workshopState } = fakePort();
    const { unmount } = renderHook(() => useSessionStatusBanner(port), {
      wrapper: languageWrapper(),
    });

    unmount();

    expect(workshopState.observed).toBe(false);
  });
});
