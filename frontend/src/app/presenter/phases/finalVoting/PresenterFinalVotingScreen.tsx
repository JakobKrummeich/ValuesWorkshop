"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresenterFinalVotingScreen.module.css";

export function PresenterFinalVotingScreen() {
  const { translate } = useTranslation();

  return (
    <section
      className={styles.screen}
      data-testid="presenter-final-voting-screen"
    >
      <h2 className={styles.heading}>
        {translate(MessageKey.FinalVotingOngoingHeading)}
      </h2>
      <p className={styles.body}>
        {translate(MessageKey.FinalVotingOngoingBody)}
      </p>
    </section>
  );
}
