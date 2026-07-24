import { renderHook, act } from "@testing-library/react";
import { Subject, of, throwError, NEVER } from "rxjs";
import type { User } from "oidc-client-ts";
import { useAuthGuard, AuthGuardState } from "../useAuthGuard";

const mockGetAuthenticatedUser$ = jest.fn();
const mockLoginRedirect$ = jest.fn();

jest.mock("../../adapters/authAdapter", () => ({
  getAuthenticatedUser$: (...args: unknown[]) =>
    mockGetAuthenticatedUser$(...args),
  loginRedirect$: (...args: unknown[]) => mockLoginRedirect$(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLoginRedirect$.mockReturnValue(of(undefined));
});

describe("useAuthGuard", () => {
  it("starts in checking state", () => {
    mockGetAuthenticatedUser$.mockReturnValue(NEVER);

    const { result } = renderHook(() => useAuthGuard());

    expect(result.current.state).toBe(AuthGuardState.Checking);
  });

  it("transitions to authenticated when user exists", () => {
    const user$ = new Subject<User | null>();
    mockGetAuthenticatedUser$.mockReturnValue(user$);

    const { result } = renderHook(() => useAuthGuard());
    expect(result.current.state).toBe(AuthGuardState.Checking);

    act(() => {
      user$.next({ access_token: "token", expired: false } as User);
      user$.complete();
    });

    expect(result.current.state).toBe(AuthGuardState.Authenticated);
  });

  it("transitions to redirecting and calls loginRedirect$ when no user", () => {
    const user$ = new Subject<User | null>();
    mockLoginRedirect$.mockReturnValue(of(undefined));
    mockGetAuthenticatedUser$.mockReturnValue(user$);

    const { result } = renderHook(() => useAuthGuard());

    act(() => {
      user$.next(null);
      user$.complete();
    });

    expect(result.current.state).toBe(AuthGuardState.Redirecting);
    expect(mockLoginRedirect$).toHaveBeenCalledWith(window.location.pathname);
  });

  it("transitions to error when loginRedirect$ errors", () => {
    const user$ = new Subject<User | null>();
    mockLoginRedirect$.mockReturnValue(
      throwError(() => new Error("OIDC unavailable")),
    );
    mockGetAuthenticatedUser$.mockReturnValue(user$);

    const { result } = renderHook(() => useAuthGuard());

    act(() => {
      user$.next(null);
      user$.complete();
    });

    expect(result.current.state).toBe(AuthGuardState.Error);
  });

  it("transitions to error when getAuthenticatedUser$ errors", () => {
    mockGetAuthenticatedUser$.mockReturnValue(
      throwError(() => new Error("Storage error")),
    );

    const { result } = renderHook(() => useAuthGuard());

    expect(result.current.state).toBe(AuthGuardState.Error);
  });

  it("unsubscribes on unmount", () => {
    const user$ = new Subject<User | null>();
    mockGetAuthenticatedUser$.mockReturnValue(user$);

    const { unmount } = renderHook(() => useAuthGuard());
    expect(user$.observed).toBe(true);

    unmount();
    expect(user$.observed).toBe(false);
  });
});
