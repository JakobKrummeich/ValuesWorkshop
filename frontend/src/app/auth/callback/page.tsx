"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { handleCallback, navigateReplace } from "../../../adapters/authAdapter";

const centeringStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
};

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function processCallback() {
      try {
        const user = await handleCallback();
        if (cancelled) return;

        const stateUrl =
          typeof user.state === "string" ? user.state : null;
        const returnUrl =
          stateUrl && stateUrl.startsWith("/") ? stateUrl : "/";
        navigateReplace(returnUrl);
      } catch (callbackError) {
        if (cancelled) return;
        setError(
          callbackError instanceof Error
            ? callbackError.message
            : "Authentication failed",
        );
      }
    }

    processCallback();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div style={{ ...centeringStyle, flexDirection: "column", gap: "1rem" }}>
        <p>Authentication error: {error}</p>
        <Link href="/">Return to home</Link>
      </div>
    );
  }

  return (
    <div style={centeringStyle}>
      <p>Completing login…</p>
    </div>
  );
}
