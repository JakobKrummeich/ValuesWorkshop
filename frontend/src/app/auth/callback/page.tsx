"use client";

import Link from "next/link";
import { useAuthCallback } from "./useAuthCallback";
import styles from "./CallbackPage.module.css";

export default function AuthCallbackPage() {
  const { error } = useAuthCallback();

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
