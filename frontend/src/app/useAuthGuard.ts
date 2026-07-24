"use client";

import { useEffect, useState } from "react";
import { concat, defer, EMPTY, take, tap, catchError } from "rxjs";
import { getAuthenticatedUser, loginRedirect } from "../adapters/authAdapter";

export enum AuthGuardState {
  Checking = "checking",
  Authenticated = "authenticated",
  Redirecting = "redirecting",
  Error = "error",
}

export interface AuthGuardResult {
  state: AuthGuardState;
}

export function useAuthGuard(): AuthGuardResult {
  const [authState, setAuthState] = useState<AuthGuardState>(
    AuthGuardState.Checking,
  );

  useEffect(() => {
    const subscription = concat(
      getAuthenticatedUser().pipe(
        tap(() => setAuthState(AuthGuardState.Authenticated)),
      ),
      defer(() => {
        setAuthState(AuthGuardState.Redirecting);
        return loginRedirect(window.location.pathname);
      }),
    )
      .pipe(
        take(1),
        catchError(() => {
          setAuthState(AuthGuardState.Error);
          return EMPTY;
        }),
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { state: authState };
}
