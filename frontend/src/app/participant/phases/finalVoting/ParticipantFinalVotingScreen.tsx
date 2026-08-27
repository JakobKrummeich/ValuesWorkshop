"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantFinalVotingState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { SubmittedConfirmation } from "../../../SubmittedConfirmation";
import styles from "./ParticipantFinalVotingScreen.module.css";
import { useParticipantFinalVotingScreen } from "./useParticipantFinalVotingScreen";
import { VoteCard } from "./VoteCard";

export function ParticipantFinalVotingScreen({
  state,
}: {
  state: ParticipantFinalVotingState;
}) {
  const { translate } = useTranslation();
  const {
    showConfirmation,
    cards,
    usedVotes,
    allotment,
    canSubmit,
    addVote,
    removeVote,
    submitVotes,
    rejectionMessage,
  } = useParticipantFinalVotingScreen(state.voting);

  if (showConfirmation) {
    return (
      <section className={styles.screen}>
        <SubmittedConfirmation
          heading={MessageKey.FinalVotingSubmittedHeading}
          body={MessageKey.FinalVotingSubmittedBody}
          testId="votes-submitted-confirmation"
        />
      </section>
    );
  }

  return (
    <section className={styles.screen}>
      <p className={styles.votesUsed} data-testid="votes-used">
        {translate(MessageKey.FinalVotingVotesUsed, {
          used: usedVotes,
          total: allotment,
        })}
      </p>
      <ul className={styles.cards}>
        {cards.map((card) => (
          <li key={card.valueId}>
            <VoteCard card={card} onAdd={addVote} onRemove={removeVote} />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.submitButton}
        data-testid="submit-votes-button"
        disabled={!canSubmit}
        onClick={submitVotes}
      >
        {allotment === 1
          ? translate(MessageKey.FinalVotingSubmitSingle)
          : translate(MessageKey.FinalVotingSubmit, { total: allotment })}
      </button>
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
    </section>
  );
}
