"use client";

import { MessageKey } from "../domain/i18n/messages";
import type { MessageParameters } from "../domain/i18n/translate";
import { useTranslation } from "./i18n/useTranslation";
import { ScreenCopy } from "./ScreenCopy";
import styles from "./WaitingScreen.module.css";

export function WaitingScreen({
  heading,
  body,
  bodyParameters,
}: {
  heading: MessageKey;
  body?: MessageKey;
  bodyParameters?: MessageParameters;
}) {
  const { translate } = useTranslation();

  return (
    <section
      className={styles.screen}
      data-testid="waiting-screen"
      aria-label={translate(MessageKey.WaitingWatchWall)}
    >
      <div className={styles.aurora} aria-hidden="true">
        <span className={`${styles.blob} ${styles.blobOne}`} />
        <span className={`${styles.blob} ${styles.blobTwo}`} />
        <span className={`${styles.blob} ${styles.blobThree}`} />
      </div>
      <ScreenCopy
        heading={translate(heading)}
        body={body === undefined ? undefined : translate(body, bodyParameters)}
      />
    </section>
  );
}
