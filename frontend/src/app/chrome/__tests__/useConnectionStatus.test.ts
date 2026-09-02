import { renderHook } from "@testing-library/react";
import { ConnectionState } from "../../../domain/connectionState";
import { Language } from "../../../domain/i18n/language";
import { languageWrapper } from "../../../testing/languageWrapper";
import { useConnectionStatus } from "../useConnectionStatus";

describe("connection status logic", () => {
  it("names a healthy connection", () => {
    const { result } = renderHook(
      () => useConnectionStatus(ConnectionState.Connected),
      { wrapper: languageWrapper() },
    );

    expect(result.current).toEqual({ text: "Connected", isConnected: true });
  });

  it.each([
    [ConnectionState.Connecting, "Connecting"],
    [ConnectionState.Reconnecting, "Reconnecting"],
    [ConnectionState.Disconnected, "Disconnected"],
  ])("flags %s as not connected", (state, text) => {
    const { result } = renderHook(() => useConnectionStatus(state), {
      wrapper: languageWrapper(),
    });

    expect(result.current).toEqual({ text, isConnected: false });
  });

  it("speaks the chosen language", () => {
    const { result } = renderHook(
      () => useConnectionStatus(ConnectionState.Reconnecting),
      { wrapper: languageWrapper(Language.German) },
    );

    expect(result.current.text).toBe("Verbindung wird wiederhergestellt");
  });
});
