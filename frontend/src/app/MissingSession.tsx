"use client";

import { MessageKey } from "../domain/i18n/messages";
import { useTranslation } from "./i18n/useTranslation";
import styles from "./MissingSession.module.css";

export function MissingSession() {
  const { translate } = useTranslation();

  return (
    <div className={styles.container}>
      <p>{translate(MessageKey.MissingSession)}</p>
    </div>
  );
}
