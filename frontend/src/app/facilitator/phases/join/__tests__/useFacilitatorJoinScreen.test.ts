import { act, renderHook } from "@testing-library/react";
import { EMPTY, Subject, throwError } from "rxjs";
import { participantJoinUrl } from "../../../../../adapters/browserLocation";
import { copyToClipboard } from "../../../../../adapters/clipboard";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { useFacilitatorJoinScreen } from "../useFacilitatorJoinScreen";

jest.mock("../../../../../adapters/browserLocation", () => ({
  participantJoinUrl: jest.fn(),
}));
jest.mock("../../../../../adapters/clipboard", () => ({
  copyToClipboard: jest.fn(),
}));

const joinUrl = participantJoinUrl as jest.MockedFunction<
  typeof participantJoinUrl
>;
const copy = copyToClipboard as jest.MockedFunction<typeof copyToClipboard>;

const JOIN_URL = "https://workshop.test/participant?sessionIdentity=abc-123";

beforeEach(() => {
  joinUrl.mockReturnValue(JOIN_URL);
  copy.mockReturnValue(EMPTY);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("facilitator join screen", () => {
  it("offers the join url of the current session", () => {
    const { result } = renderHook(() => useFacilitatorJoinScreen());

    expect(result.current.joinUrl).toBe(JOIN_URL);
    expect(result.current.copyOutcome).toBeNull();
  });

  it("confirms a copy that reached the clipboard", () => {
    const { result } = renderHook(() => useFacilitatorJoinScreen());

    act(() => result.current.copyJoinUrl());

    expect(copy).toHaveBeenCalledWith(JOIN_URL);
    expect(result.current.copyOutcome).toBe(MessageKey.JoinUrlCopied);
  });

  it("reports a clipboard the browser refused", () => {
    copy.mockReturnValue(throwError(() => new Error("denied")));
    const { result } = renderHook(() => useFacilitatorJoinScreen());

    act(() => result.current.copyJoinUrl());

    expect(result.current.copyOutcome).toBe(MessageKey.JoinUrlCopyFailed);
  });

  it("copies nothing while the link carries no session", () => {
    joinUrl.mockReturnValue(null);
    const { result } = renderHook(() => useFacilitatorJoinScreen());

    act(() => result.current.copyJoinUrl());

    expect(copy).not.toHaveBeenCalled();
    expect(result.current.copyOutcome).toBeNull();
  });

  it("drops a copy still in flight when the screen is gone", () => {
    const pendingCopy = new Subject<never>();
    copy.mockReturnValue(pendingCopy);
    const { result, unmount } = renderHook(() => useFacilitatorJoinScreen());

    act(() => result.current.copyJoinUrl());
    unmount();

    expect(pendingCopy.observed).toBe(false);
  });
});
