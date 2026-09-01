"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import type { RevealedWinnerModel } from "./usePresenterFinalPresentationScreen";
import styles from "./WinnerReveal.module.css";

export function WinnerReveal({ winner }: { winner: RevealedWinnerModel }) {
  const { language, translate } = useTranslation();

  return (
    <section className={styles.screen} data-testid="winner-reveal">
      <p className={styles.place} data-testid="winner-place">
        {translate(MessageKey.FinalPresentationPlace, { place: winner.place })}
      </p>
      <h2 className={styles.valueName} data-testid="winner-value">
        {localizedText(language, winner.text)}
      </h2>
      <p className={styles.voteCount} data-testid="winner-vote-count">
        {translate(winner.voteCountKey, { count: winner.voteCount })}
      </p>
      {winner.actions.length > 0 && (
        <section className={styles.actions} data-testid="winner-actions">
          <p className={styles.actionsHeading}>
            {translate(MessageKey.FinalPresentationActions)}
          </p>
          <ol className={styles.actionList}>
            {winner.actions.map((action, index) => (
              <li
                key={index}
                className={styles.action}
                data-testid="winner-action"
              >
                {action}
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
