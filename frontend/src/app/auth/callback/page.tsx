"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { handleCallback, navigateReplace } from "../../../adapters/authAdapter";
import styles from "./CallbackPage.module.css";

function extractReturnUrl(state: unknown): string {
  return typeof state === "string" && state.startsWith("/") ? state : "/";
}

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Authentication failed";
}

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function processCallback() {
      try {
        const user = await handleCallback();
        if (cancelled) return;
        navigateReplace(extractReturnUrl(user.state));
      } catch (callbackError) {
        if (!cancelled) setError(extractErrorMessage(callbackError));
      }
    }

    processCallback();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Authentication error: {error}</p>
        <Link href="/">Return to home</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p>Completing login…</p>
    </div>
  );
}
