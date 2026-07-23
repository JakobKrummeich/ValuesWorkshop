"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getAuthenticatedUser, loginRedirect } from "../adapters/authAdapter";
import styles from "./AuthGuard.module.css";

type AuthState = "checking" | "authenticated" | "redirecting" | "error";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const user = await getAuthenticatedUser();

      if (cancelled) return;

      if (user) {
        setAuthState("authenticated");
      } else {
        setAuthState("redirecting");
        try {
          await loginRedirect(window.location.pathname);
        } catch {
          if (!cancelled) setAuthState("error");
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (authState === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <p>
        {authState === "error"
          ? "Unable to connect to the login provider. Please try again later."
          : authState === "checking"
            ? "Checking authentication…"
            : "Redirecting to login…"}
      </p>
    </div>
  );
}
