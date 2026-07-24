"use client";

import { useEffect, useState } from "react";
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
    const subscription = getAuthenticatedUser$().subscribe({
      next(user) {
        if (user) {
          setAuthState(AuthGuardState.Authenticated);
        } else {
          setAuthState(AuthGuardState.Redirecting);
          loginRedirect$(window.location.pathname).subscribe({
            error() {
              setAuthState(AuthGuardState.Error);
            },
          });
        }
      },
      error() {
        setAuthState(AuthGuardState.Error);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { state: authState };
}
