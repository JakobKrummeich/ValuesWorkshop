import { act, renderHook } from "@testing-library/react";
import { participantJoinUrl } from "../../../../../adapters/browserLocation";
import { Phase } from "../../../../../domain/phases";
import type { PresenterJoinState } from "../../../../../domain/workshopState";
import {
  newestGlowMilliseconds,
  usePresenterJoinScreen,
  visibleNameLimit,
} from "../usePresenterJoinScreen";

jest.mock("../../../../../adapters/browserLocation", () => ({
  participantJoinUrl: jest.fn(),
}));

const joinUrl = participantJoinUrl as jest.MockedFunction<
  typeof participantJoinUrl
>;

function lobby(displayNames: string[]): PresenterJoinState {
  return {
    revision: 2,
    phase: Phase.Join,
    participantCount: displayNames.length,
    participantDisplayNames: displayNames,
  };
}

function names(count: number): string[] {
  return Array.from({ length: count }, (unused, index) => `Name ${index + 1}`);
}

beforeEach(() => {
  jest.useFakeTimers();
  joinUrl.mockReturnValue("https://workshop.test/participant?x=1");
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("presenter join screen", () => {
  it("offers the join url the browser location carries", () => {
    const { result } = renderHook(() => usePresenterJoinScreen(lobby([])));

    expect(result.current.joinUrl).toBe(
      "https://workshop.test/participant?x=1",
    );
  });

  it("has no join url while the link carries no session", () => {
    joinUrl.mockReturnValue(null);

    const { result } = renderHook(() => usePresenterJoinScreen(lobby([])));

    expect(result.current.joinUrl).toBeNull();
  });

  it("lists the names already present without marking any as newest", () => {
    const { result } = renderHook(() =>
      usePresenterJoinScreen(lobby(["Ada", "Grace"])),
    );

    expect(result.current.visibleNames).toEqual([
      { name: "Ada", isNewest: false },
      { name: "Grace", isNewest: false },
    ]);
    expect(result.current.hiddenCount).toBe(0);
    expect(result.current.pingKey).toBe(0);
  });

  it("marks the names that just arrived and pings once per arrival", () => {
    const { result, rerender } = renderHook(
      (state: PresenterJoinState) => usePresenterJoinScreen(state),
      { initialProps: lobby(["Ada"]) },
    );

    rerender(lobby(["Ada", "Grace", "Linus"]));

    expect(result.current.visibleNames).toEqual([
      { name: "Ada", isNewest: false },
      { name: "Grace", isNewest: true },
      { name: "Linus", isNewest: true },
    ]);
    expect(result.current.pingKey).toBe(1);

    rerender(lobby(["Ada", "Grace", "Linus", "Mary"]));

    expect(result.current.pingKey).toBe(2);
    expect(result.current.visibleNames.map(({ isNewest }) => isNewest)).toEqual(
      [false, false, false, true],
    );
  });

  it("lets the newest glow fade after a moment", () => {
    const { result, rerender } = renderHook(
      (state: PresenterJoinState) => usePresenterJoinScreen(state),
      { initialProps: lobby([]) },
    );

    rerender(lobby(["Ada"]));
    act(() => jest.advanceTimersByTime(newestGlowMilliseconds));

    expect(result.current.visibleNames).toEqual([
      { name: "Ada", isNewest: false },
    ]);
  });

  it("neither pings nor glows when the roster shrinks", () => {
    const { result, rerender } = renderHook(
      (state: PresenterJoinState) => usePresenterJoinScreen(state),
      { initialProps: lobby(["Ada", "Grace"]) },
    );

    rerender(lobby(["Ada"]));

    expect(result.current.pingKey).toBe(0);
    expect(result.current.visibleNames).toEqual([
      { name: "Ada", isNewest: false },
    ]);
  });

  it("caps the visible names and counts the rest", () => {
    const { result } = renderHook(() =>
      usePresenterJoinScreen(lobby(names(visibleNameLimit + 7))),
    );

    expect(result.current.visibleNames).toHaveLength(visibleNameLimit);
    expect(result.current.visibleNames[0].name).toBe("Name 1");
    expect(result.current.hiddenCount).toBe(7);
  });

  it("clears the glow timer on unmount", () => {
    const { rerender, unmount } = renderHook(
      (state: PresenterJoinState) => usePresenterJoinScreen(state),
      { initialProps: lobby([]) },
    );

    rerender(lobby(["Ada"]));
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
