"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import type { RevealedWinnerModel } from "./usePresenterFinalPresentationScreen";
import styles from "./WinnerOverview.module.css";

export function WinnerOverview({
  winners,
}: {
  winners: RevealedWinnerModel[];
}) {
  const { language, translate } = useTranslation();

  return (
    <section className={styles.screen} data-testid="winner-overview">
      <h2 className={styles.heading}>
        {translate(MessageKey.FinalPresentationOverviewHeading)}
      </h2>
      <ol className={styles.winnerList}>
        {winners.map((winner) => (
          <li
            key={winner.valueId}
            className={styles.winner}
            data-testid={`overview-winner-${winner.place}`}
          >
            <span className={styles.place}>{winner.place}</span>
            <span className={styles.valueName}>
              {localizedText(language, winner.text)}
            </span>
            <span className={styles.voteCount}>
              {translate(winner.voteCountKey, { count: winner.voteCount })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
