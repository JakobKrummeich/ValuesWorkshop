import { renderHook } from "@testing-library/react";
import { participantJoinUrl } from "../../../../../adapters/browserLocation";
import { usePresenterJoinScreen } from "../usePresenterJoinScreen";

jest.mock("../../../../../adapters/browserLocation", () => ({
  participantJoinUrl: jest.fn(),
}));

const joinUrl = participantJoinUrl as jest.MockedFunction<
  typeof participantJoinUrl
>;

afterEach(() => {
  jest.clearAllMocks();
});

describe("presenter join screen", () => {
  it("offers the join url the browser location carries", () => {
    joinUrl.mockReturnValue("https://workshop.test/participant?x=1");

    const { result } = renderHook(() => usePresenterJoinScreen());

    expect(result.current).toEqual({
      joinUrl: "https://workshop.test/participant?x=1",
    });
  });

  it("has no join url while the link carries no session", () => {
    joinUrl.mockReturnValue(null);

    const { result } = renderHook(() => usePresenterJoinScreen());

    expect(result.current.joinUrl).toBeNull();
  });
});
