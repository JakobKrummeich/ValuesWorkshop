"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getAuthenticatedUser, loginRedirect } from "../adapters/authAdapter";
import styles from "./AuthGuard.module.css";

enum AuthState {
  Checking = "checking",
  Authenticated = "authenticated",
  Redirecting = "redirecting",
  Error = "error",
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(AuthState.Checking);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const user = await getAuthenticatedUser();

      if (cancelled) return;

      if (user) {
        setAuthState(AuthState.Authenticated);
      } else {
        setAuthState(AuthState.Redirecting);
        try {
          await loginRedirect(window.location.pathname);
        } catch {
          if (!cancelled) setAuthState(AuthState.Error);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (authState === AuthState.Authenticated) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <p>
        {authState === AuthState.Error
          ? "Unable to connect to the login provider. Please try again later."
          : authState === AuthState.Checking
            ? "Checking authentication\u2026"
            : "Redirecting to login\u2026"}
      </p>
    </div>
  );
}
