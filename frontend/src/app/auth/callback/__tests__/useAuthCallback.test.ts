import { renderHook, act } from "@testing-library/react";
import { Subject, NEVER, throwError } from "rxjs";
import type { User } from "oidc-client-ts";
import { useAuthCallback } from "../useAuthCallback";

const mockHandleCallback$ = jest.fn();
const mockNavigateReplace = jest.fn();

jest.mock("../../../../adapters/authAdapter", () => ({
  handleCallback$: (...args: unknown[]) => mockHandleCallback$(...args),
  navigateReplace: (...args: unknown[]) => mockNavigateReplace(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useAuthCallback", () => {
  it("starts with no error", () => {
    mockHandleCallback$.mockReturnValue(NEVER);

    const { result } = renderHook(() => useAuthCallback());

    expect(result.current.error).toBeNull();
  });

  it("navigates to return URL from user state on success", () => {
    const callback$ = new Subject<User>();
    mockHandleCallback$.mockReturnValue(callback$);

    renderHook(() => useAuthCallback());

    act(() => {
      callback$.next({
        state: "/facilitator",
        access_token: "token",
      } as unknown as User);
      callback$.complete();
    });

    expect(mockNavigateReplace).toHaveBeenCalledWith("/facilitator");
  });

  it("navigates to root when no return URL in state", () => {
    const callback$ = new Subject<User>();
    mockHandleCallback$.mockReturnValue(callback$);

    renderHook(() => useAuthCallback());

    act(() => {
      callback$.next({ access_token: "token" } as unknown as User);
      callback$.complete();
    });

    expect(mockNavigateReplace).toHaveBeenCalledWith("/");
  });

  it("rejects non-path return URLs and falls back to root", () => {
    const callback$ = new Subject<User>();
    mockHandleCallback$.mockReturnValue(callback$);

    renderHook(() => useAuthCallback());

    act(() => {
      callback$.next({
        state: "https://evil.com",
        access_token: "token",
      } as unknown as User);
      callback$.complete();
    });

    expect(mockNavigateReplace).toHaveBeenCalledWith("/");
  });

  it("sets error on callback failure", () => {
    mockHandleCallback$.mockReturnValue(
      throwError(() => new Error("Invalid state")),
    );

    const { result } = renderHook(() => useAuthCallback());

    expect(result.current.error).toBe("Invalid state");
  });

  it("sets generic error for non-Error throws", () => {
    mockHandleCallback$.mockReturnValue(throwError(() => "string error"));

    const { result } = renderHook(() => useAuthCallback());

    expect(result.current.error).toBe("Unknown error");
  });

  it("unsubscribes on unmount", () => {
    const callback$ = new Subject<User>();
    mockHandleCallback$.mockReturnValue(callback$);

    const { unmount } = renderHook(() => useAuthCallback());
    expect(callback$.observed).toBe(true);

    unmount();
    expect(callback$.observed).toBe(false);
  });
});
