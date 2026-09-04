"use client";

import type { MessageKey } from "../../domain/i18n/messages";
import { useTranslation } from "../i18n/useTranslation";
import styles from "./IntentRejection.module.css";

export function IntentRejection({ message }: { message: MessageKey | null }) {
  const { translate } = useTranslation();

  if (message === null) {
    return null;
  }

  return (
    <p className={styles.rejection} role="status">
      {translate(message)}
    </p>
  );
}
