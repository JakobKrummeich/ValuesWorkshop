"use client";

import type { ReactNode } from "react";
import { useAuthGuard, AuthGuardState } from "./useAuthGuard";
import styles from "./AuthGuard.module.css";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { state } = useAuthGuard();

  if (state === AuthGuardState.Authenticated) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <p>
        {state === AuthGuardState.Error
          ? "Unable to connect to the login provider. Please try again later."
          : state === AuthGuardState.Checking
            ? "Checking authentication\u2026"
            : "Redirecting to login\u2026"}
      </p>
    </div>
  );
}
