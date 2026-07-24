"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { handleCallback, navigateReplace } from "../../../adapters/authAdapter";
import { errorMessage } from "../../../shared/errorMessage";
import styles from "./CallbackPage.module.css";

const returnUrlSchema = z.string().startsWith("/").catch("/");

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function processCallback() {
      try {
        const user = await handleCallback();
        if (cancelled) return;
        navigateReplace(returnUrlSchema.parse(user.state));
      } catch (callbackError) {
        if (!cancelled) setError(errorMessage(callbackError));
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
