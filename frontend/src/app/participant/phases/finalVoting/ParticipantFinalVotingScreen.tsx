"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantFinalVotingState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { Pips } from "../../../Pips";
import { SubmittedConfirmation } from "../../../SubmittedConfirmation";
import { ActionBar } from "../../ActionBar";
import { CallToAction } from "../../CallToAction";
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
    remainingVotes,
    allotment,
    canSubmit,
    addVote,
    removeVote,
    submitVotes,
    rejectionMessage,
  } = useParticipantFinalVotingScreen(state.voting);

  if (showConfirmation) {
    return (
      <SubmittedConfirmation
        heading={MessageKey.FinalVotingSubmittedHeading}
        body={MessageKey.FinalVotingSubmittedBody}
        testId="votes-submitted-confirmation"
      />
    );
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <h2 className={styles.heading}>
          {translate(MessageKey.FinalVotingYourVotes)}
        </h2>
        <Pips filled={usedVotes} total={allotment} testId="vote-pips" />
        <p className="visuallyHidden" data-testid="votes-used">
          {translate(MessageKey.FinalVotingVotesUsed, {
            used: usedVotes,
            total: allotment,
          })}
        </p>
      </header>
      <ul className={styles.cards}>
        {cards.map((card) => (
          <li key={card.valueId}>
            <VoteCard card={card} onAdd={addVote} onRemove={removeVote} />
          </li>
        ))}
      </ul>
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
      <ActionBar
        hint={
          remainingVotes === 0
            ? undefined
            : translate(
                remainingVotes === 1
                  ? MessageKey.FinalVotingVoteLeftSingle
                  : MessageKey.FinalVotingVotesLeft,
                { count: remainingVotes },
              )
        }
        hintTestId="votes-left-hint"
      >
        <CallToAction
          testId="submit-votes-button"
          disabled={!canSubmit}
          onClick={submitVotes}
        >
          {allotment === 1
            ? translate(MessageKey.FinalVotingSubmitSingle)
            : translate(MessageKey.FinalVotingSubmit, { total: allotment })}
        </CallToAction>
      </ActionBar>
    </section>
  );
}
