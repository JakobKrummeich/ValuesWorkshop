"use client";

import { useEffect, useState } from "react";
import { switchMap, EMPTY, catchError } from "rxjs";
import { getAuthenticatedUser$, loginRedirect$ } from "../adapters/authAdapter";

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
    const subscription = getAuthenticatedUser$()
      .pipe(
        switchMap((user) => {
          if (user) {
            setAuthState(AuthGuardState.Authenticated);
            return EMPTY;
          }
          setAuthState(AuthGuardState.Redirecting);
          return loginRedirect$(window.location.pathname);
        }),
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
