import { renderHook } from "@testing-library/react";
import { participantJoinUrl } from "../../../../../adapters/browserLocation";
import { Phase } from "../../../../../domain/phases";
import type { PresenterJoinState } from "../../../../../domain/workshopState";
import { usePresenterJoinScreen } from "../usePresenterJoinScreen";

jest.mock("../../../../../adapters/browserLocation", () => ({
  participantJoinUrl: jest.fn(),
}));

const joinUrl = participantJoinUrl as jest.MockedFunction<
  typeof participantJoinUrl
>;

const state: PresenterJoinState = {
  revision: 2,
  phase: Phase.Join,
  participantCount: 2,
  participantDisplayNames: ["Ada Lovelace", "Alan Turing"],
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("presenter join screen", () => {
  it("offers the join url next to the lobby the state carries", () => {
    joinUrl.mockReturnValue("https://workshop.test/participant?x=1");

    const { result } = renderHook(() => usePresenterJoinScreen(state));

    expect(result.current).toEqual({
      joinUrl: "https://workshop.test/participant?x=1",
      displayNames: ["Ada Lovelace", "Alan Turing"],
      participantCount: 2,
    });
  });

  it("has no join url while the link carries no session", () => {
    joinUrl.mockReturnValue(null);

    const { result } = renderHook(() => usePresenterJoinScreen(state));

    expect(result.current.joinUrl).toBeNull();
  });
});
