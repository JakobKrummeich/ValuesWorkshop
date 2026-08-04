"use client";

import Link from "next/link";
import { MessageKey } from "../../../domain/i18n/messages";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthCallback } from "./useAuthCallback";
import styles from "./CallbackPage.module.css";

export default function AuthCallbackPage() {
  const { error } = useAuthCallback();
  const { translate } = useTranslation();

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{translate(MessageKey.AuthCallbackFailed, { detail: error })}</p>
        <Link href="/">{translate(MessageKey.AuthCallbackReturnHome)}</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p>{translate(MessageKey.AuthCallbackCompleting)}</p>
    </div>
  );
}
