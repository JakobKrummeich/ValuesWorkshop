import { renderHook, act } from "@testing-library/react";
import { Subject, NEVER, throwError } from "rxjs";
import type { User } from "oidc-client-ts";
import { useAuthCallback } from "../useAuthCallback";

const mockHandleCallback = jest.fn();
const mockNavigateReplace = jest.fn();

jest.mock("../../../../adapters/authAdapter", () => ({
  handleCallback: (...args: unknown[]) => mockHandleCallback(...args),
}));
jest.mock("../../../../adapters/browserLocation", () => ({
  navigateReplace: (...args: unknown[]) => mockNavigateReplace(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useAuthCallback", () => {
  it("starts with no error", () => {
    mockHandleCallback.mockReturnValue(NEVER);

    const { result } = renderHook(() => useAuthCallback());

    expect(result.current.error).toBeNull();
  });

  it("navigates to return URL from user state on success", () => {
    const callbackSubject = new Subject<User>();
    mockHandleCallback.mockReturnValue(callbackSubject);

    renderHook(() => useAuthCallback());

    act(() => {
      callbackSubject.next({
        state: "/facilitator",
        access_token: "token",
      } as unknown as User);
      callbackSubject.complete();
    });

    expect(mockNavigateReplace).toHaveBeenCalledWith("/facilitator");
  });

  it("navigates to root when no return URL in state", () => {
    const callbackSubject = new Subject<User>();
    mockHandleCallback.mockReturnValue(callbackSubject);

    renderHook(() => useAuthCallback());

    act(() => {
      callbackSubject.next({ access_token: "token" } as unknown as User);
      callbackSubject.complete();
    });

    expect(mockNavigateReplace).toHaveBeenCalledWith("/");
  });

  it("rejects non-path return URLs and falls back to root", () => {
    const callbackSubject = new Subject<User>();
    mockHandleCallback.mockReturnValue(callbackSubject);

    renderHook(() => useAuthCallback());

    act(() => {
      callbackSubject.next({
        state: "https://evil.com",
        access_token: "token",
      } as unknown as User);
      callbackSubject.complete();
    });

    expect(mockNavigateReplace).toHaveBeenCalledWith("/");
  });

  it("sets error on callback failure", () => {
    mockHandleCallback.mockReturnValue(
      throwError(() => new Error("Invalid state")),
    );

    const { result } = renderHook(() => useAuthCallback());

    expect(result.current.error).toBe("Invalid state");
  });

  it("sets generic error for non-Error throws", () => {
    mockHandleCallback.mockReturnValue(throwError(() => "string error"));

    const { result } = renderHook(() => useAuthCallback());

    expect(result.current.error).toBe("Unknown error");
  });

  it("unsubscribes on unmount", () => {
    const callbackSubject = new Subject<User>();
    mockHandleCallback.mockReturnValue(callbackSubject);

    const { unmount } = renderHook(() => useAuthCallback());
    expect(callbackSubject.observed).toBe(true);

    unmount();
    expect(callbackSubject.observed).toBe(false);
  });
});
