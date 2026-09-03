import { renderHook, act } from "@testing-library/react";
import { Subject } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Language } from "../../../domain/i18n/language";
import type { PhasedWorkshopState } from "../../../domain/workshopState";
import { languageWrapper } from "../../../testing/languageWrapper";
import { useConnectionStatus } from "../useConnectionStatus";

function fakePort() {
  const workshopState = new Subject<PhasedWorkshopState>();
  const connectionState = new Subject<ConnectionState>();

  return {
    port: { workshopState, connectionState },
    workshopState,
    connectionState,
  };
}

describe("connection status logic", () => {
  it("starts out connecting", () => {
    const { port } = fakePort();

    const { result } = renderHook(() => useConnectionStatus(port), {
      wrapper: languageWrapper(),
    });

    expect(result.current).toEqual({ text: "Connecting", isConnected: false });
  });

  it("names a healthy connection", () => {
    const { port, connectionState } = fakePort();
    const { result } = renderHook(() => useConnectionStatus(port), {
      wrapper: languageWrapper(),
    });

    act(() => connectionState.next(ConnectionState.Connected));

    expect(result.current).toEqual({ text: "Connected", isConnected: true });
  });

  it.each([
    [ConnectionState.Connecting, "Connecting"],
    [ConnectionState.Reconnecting, "Reconnecting"],
    [ConnectionState.Disconnected, "Disconnected"],
  ])("flags %s as not connected", (state, text) => {
    const { port, connectionState } = fakePort();
    const { result } = renderHook(() => useConnectionStatus(port), {
      wrapper: languageWrapper(),
    });

    act(() => connectionState.next(state));

    expect(result.current).toEqual({ text, isConnected: false });
  });

  it("speaks the chosen language", () => {
    const { port, connectionState } = fakePort();
    const { result } = renderHook(() => useConnectionStatus(port), {
      wrapper: languageWrapper(Language.German),
    });

    act(() => connectionState.next(ConnectionState.Reconnecting));

    expect(result.current.text).toBe("Verbindung wird wiederhergestellt");
  });

  it("stops listening when the screen is left", () => {
    const { port, connectionState } = fakePort();
    const { unmount } = renderHook(() => useConnectionStatus(port), {
      wrapper: languageWrapper(),
    });

    unmount();

    expect(connectionState.observed).toBe(false);
  });
});
