"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { ActionLedger, ActionLedgerVariant } from "../../../ActionLedger";
import { Confetti } from "../../../Confetti";
import { useTranslation } from "../../../i18n/useTranslation";
import type { RevealedWinnerModel } from "./usePresenterFinalPresentationScreen";
import { useRevealCelebration } from "./useRevealCelebration";
import styles from "./WinnerReveal.module.css";

export function WinnerReveal({ winner }: { winner: RevealedWinnerModel }) {
  const { language, translate } = useTranslation();
  const isCelebrating = useRevealCelebration(winner.actions.length);

  return (
    <section className={styles.screen} data-testid="winner-reveal">
      <div className={styles.context}>
        <span className={styles.numeral} aria-hidden="true">
          {winner.place}
        </span>
        <p className={styles.eyebrow}>
          <span data-testid="winner-place">
            {translate(MessageKey.FinalPresentationPlace, {
              place: winner.place,
            })}
          </span>
          <span aria-hidden="true">·</span>
          <span data-testid="winner-vote-count">
            {translate(winner.voteCountKey, { count: winner.voteCount })}
          </span>
        </p>
        <h2 className={styles.valueName} data-testid="winner-value">
          {localizedText(language, winner.text)}
        </h2>
      </div>
      {winner.actions.length > 0 && (
        <div className={styles.actions} data-testid="winner-actions">
          <ActionLedger
            actions={winner.actions.map((text, index) => ({
              id: `${index}-${text}`,
              text,
            }))}
            variant={ActionLedgerVariant.Slabs}
            stagger
            actionTestId="winner-action"
          />
        </div>
      )}
      {isCelebrating && <Confetti />}
    </section>
  );
}
