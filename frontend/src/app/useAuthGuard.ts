"use client";

import { useEffect, useState } from "react";
import { concat, defer, take, tap } from "rxjs";
import { getAuthenticatedUser, loginRedirect } from "../adapters/authAdapter";
import { currentReturnUrl } from "../adapters/browserLocation";

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
        return loginRedirect(currentReturnUrl());
      }),
    )
      .pipe(take(1))
      .subscribe({
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
