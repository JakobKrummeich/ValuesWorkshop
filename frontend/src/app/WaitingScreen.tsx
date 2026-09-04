"use client";

import type { ReactNode } from "react";
import { MessageKey } from "../domain/i18n/messages";
import type { MessageParameters } from "../domain/i18n/translate";
import { Aurora } from "./Aurora";
import { useTranslation } from "./i18n/useTranslation";
import { ScreenCopy } from "./ScreenCopy";
import styles from "./WaitingScreen.module.css";

export function WaitingScreen({
  heading,
  headingParameters,
  headingTestId,
  body,
  bodyParameters,
  children,
}: {
  heading: MessageKey;
  headingParameters?: MessageParameters;
  headingTestId?: string;
  body?: MessageKey;
  bodyParameters?: MessageParameters;
  children?: ReactNode;
}) {
  const { translate } = useTranslation();

  return (
    <section
      className={styles.screen}
      data-testid="waiting-screen"
      aria-label={translate(MessageKey.WaitingWatchWall)}
    >
      <Aurora />
      <ScreenCopy
        heading={translate(heading, headingParameters)}
        headingTestId={headingTestId}
        body={body === undefined ? undefined : translate(body, bodyParameters)}
      />
      {children}
    </section>
  );
}
