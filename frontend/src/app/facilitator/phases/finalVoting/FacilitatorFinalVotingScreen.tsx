"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorFinalVotingState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./FacilitatorFinalVotingScreen.module.css";
import { useFacilitatorFinalVotingScreen } from "./useFacilitatorFinalVotingScreen";

export function FacilitatorFinalVotingScreen({
  state,
}: {
  state: FacilitatorFinalVotingState;
}) {
  const { language, translate } = useTranslation();
  const {
    roundNumber,
    votedCount,
    participantCount,
    isRoundOpen,
    isCloseVotingEnabled,
    isStartTiebreakEnabled,
    tallies,
    tie,
    isSending,
    rejectionMessage,
    closeVoting,
    startTiebreakRound,
  } = useFacilitatorFinalVotingScreen(state);

  return (
    <section
      className={styles.screen}
      data-testid="facilitator-final-voting-screen"
    >
      <p className={styles.votedCount} data-testid="voted-count">
        {translate(MessageKey.FinalVotingRoundVoted, {
          round: roundNumber,
          voted: votedCount,
          total: participantCount,
        })}
      </p>
      {isRoundOpen && (
        <button
          type="button"
          className={styles.controlButton}
          data-testid="close-voting-button"
          disabled={isSending || !isCloseVotingEnabled}
          onClick={closeVoting}
        >
          {translate(MessageKey.FinalVotingCloseVoting)}
        </button>
      )}
      {tallies !== null && (
        <section className={styles.tallies}>
          <h3 className={styles.talliesHeading}>
            {translate(MessageKey.FinalVotingLastRoundResults)}
          </h3>
          <ol className={styles.tallyList} data-testid="closed-round-tallies">
            {tallies.map((tally) => (
              <li
                key={tally.valueId}
                className={styles.tally}
                data-testid={`tally-${tally.valueId}`}
              >
                <span>{localizedText(language, tally.text)}</span>
                <span className={styles.tallyCount}>
                  {translate(MessageKey.FinalVotingVoteCount, {
                    count: tally.voteCount,
                  })}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {tie !== null && (
        <div className={styles.tie}>
          <p className={styles.tieCallout} data-testid="tie-callout">
            {translate(MessageKey.FinalVotingTie, {
              values: tie.values
                .map((text) => localizedText(language, text))
                .join(" = "),
              count: tie.voteCount,
            })}
          </p>
          <button
            type="button"
            className={styles.controlButton}
            data-testid="start-tiebreak-button"
            disabled={isSending || !isStartTiebreakEnabled}
            onClick={startTiebreakRound}
          >
            {translate(MessageKey.FinalVotingStartTiebreak)}
          </button>
        </div>
      )}
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
    </section>
  );
}
