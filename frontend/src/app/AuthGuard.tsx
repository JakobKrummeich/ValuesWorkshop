"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getAuthenticatedUser, loginRedirect } from "../adapters/authAdapter";

type AuthState = "checking" | "authenticated" | "redirecting";

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
        await loginRedirect(window.location.pathname);
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <p>
        {authState === "checking"
          ? "Checking authentication…"
          : "Redirecting to login…"}
      </p>
    </div>
  );
}
