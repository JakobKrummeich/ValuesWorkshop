import { renderHook, act } from "@testing-library/react";
import { Subject, of, throwError, NEVER, EMPTY } from "rxjs";
import type { User } from "oidc-client-ts";
import { useAuthGuard, AuthGuardState } from "../useAuthGuard";

const mockGetAuthenticatedUser = jest.fn();
const mockLoginRedirect = jest.fn();

jest.mock("../../adapters/authAdapter", () => ({
  getAuthenticatedUser: (...args: unknown[]) =>
    mockGetAuthenticatedUser(...args),
  loginRedirect: (...args: unknown[]) => mockLoginRedirect(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLoginRedirect.mockReturnValue(EMPTY);
});

describe("useAuthGuard", () => {
  it("starts in checking state", () => {
    mockGetAuthenticatedUser.mockReturnValue(NEVER);

    const { result } = renderHook(() => useAuthGuard());

    expect(result.current.state).toBe(AuthGuardState.Checking);
  });

  it("transitions to authenticated when user emitted", () => {
    const userSubject = new Subject<User>();
    mockGetAuthenticatedUser.mockReturnValue(userSubject);

    const { result } = renderHook(() => useAuthGuard());
    expect(result.current.state).toBe(AuthGuardState.Checking);

    act(() => {
      userSubject.next({ access_token: "token", expired: false } as User);
      userSubject.complete();
    });

    expect(result.current.state).toBe(AuthGuardState.Authenticated);
  });

  it("transitions to redirecting and calls loginRedirect when no user emitted", () => {
    mockGetAuthenticatedUser.mockReturnValue(EMPTY);
    mockLoginRedirect.mockReturnValue(EMPTY);

    const { result } = renderHook(() => useAuthGuard());

    expect(result.current.state).toBe(AuthGuardState.Redirecting);
    expect(mockLoginRedirect).toHaveBeenCalledWith(window.location.pathname);
  });

  it("transitions to error when loginRedirect errors", () => {
    mockGetAuthenticatedUser.mockReturnValue(EMPTY);
    mockLoginRedirect.mockReturnValue(
      throwError(() => new Error("OIDC unavailable")),
    );

    const { result } = renderHook(() => useAuthGuard());

    expect(result.current.state).toBe(AuthGuardState.Error);
  });

  it("transitions to error when getAuthenticatedUser errors", () => {
    mockGetAuthenticatedUser.mockReturnValue(
      throwError(() => new Error("Storage error")),
    );

    const { result } = renderHook(() => useAuthGuard());

    expect(result.current.state).toBe(AuthGuardState.Error);
  });

  it("does not call loginRedirect when user is authenticated", () => {
    mockGetAuthenticatedUser.mockReturnValue(
      of({ access_token: "token", expired: false } as User),
    );

    renderHook(() => useAuthGuard());

    expect(mockLoginRedirect).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", () => {
    const userSubject = new Subject<User>();
    mockGetAuthenticatedUser.mockReturnValue(userSubject);

    const { unmount } = renderHook(() => useAuthGuard());
    expect(userSubject.observed).toBe(true);

    unmount();
    expect(userSubject.observed).toBe(false);
  });
});
