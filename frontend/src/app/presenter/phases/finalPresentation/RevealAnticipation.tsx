"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./RevealAnticipation.module.css";

export function RevealAnticipation() {
  const { translate } = useTranslation();

  return (
    <section className={styles.screen} data-testid="reveal-anticipation">
      <h2 className={styles.title}>
        {translate(MessageKey.FinalPresentationAnticipation)}
      </h2>
    </section>
  );
}
