"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { Eyebrow, EyebrowTone } from "../../../Eyebrow";
import { useTranslation } from "../../../i18n/useTranslation";
import type { RevealedWinnerModel } from "./usePresenterFinalPresentationScreen";
import styles from "./WinnerOverview.module.css";

export function WinnerOverview({
  podium,
  runnersUp,
}: {
  podium: readonly RevealedWinnerModel[];
  runnersUp: readonly RevealedWinnerModel[];
}) {
  const { language, translate } = useTranslation();

  return (
    <section className={styles.screen} data-testid="winner-overview">
      <Eyebrow>
        {translate(MessageKey.FinalPresentationOverviewHeading)}
      </Eyebrow>
      <ol className={styles.podium}>
        {podium.map((winner) => (
          <li
            key={winner.valueId}
            className={styles.column}
            data-place={winner.place}
            data-testid={`overview-winner-${winner.place}`}
          >
            <span className={styles.valueName}>
              {localizedText(language, winner.text)}
            </span>
            <Eyebrow tone={EyebrowTone.Muted} className={styles.voteCount}>
              {translate(winner.voteCountKey, { count: winner.voteCount })}
            </Eyebrow>
            <span className={styles.pillar}>
              <span className={styles.place}>{winner.place}</span>
            </span>
          </li>
        ))}
      </ol>
      {runnersUp.length > 0 && (
        <ol className={styles.runnersUp}>
          {runnersUp.map((winner) => (
            <li
              key={winner.valueId}
              className={styles.card}
              data-testid={`overview-winner-${winner.place}`}
            >
              <span className={styles.cardPlace}>{winner.place}</span>
              <span className={styles.cardValueName}>
                {localizedText(language, winner.text)}
              </span>
              <span className={styles.cardVoteCount}>
                {translate(winner.voteCountKey, { count: winner.voteCount })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
