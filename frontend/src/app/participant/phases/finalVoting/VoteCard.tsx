"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import type { VoteCardModel } from "./useParticipantFinalVotingScreen";
import styles from "./VoteCard.module.css";

export function VoteCard({
  card,
  onAdd,
  onRemove,
}: {
  card: VoteCardModel;
  onAdd: (valueId: string) => void;
  onRemove: (valueId: string) => void;
}) {
  const { language, translate } = useTranslation();
  const valueName = localizedText(language, card.text);

  return (
    <article className={styles.card} data-testid={`vote-card-${card.valueId}`}>
      <h3 className={styles.valueName}>{valueName}</h3>
      {card.actions.length > 0 && (
        <ul className={styles.actions}>
          {card.actions.map((action, index) => (
            <li key={index} className={styles.action}>
              {action}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepButton}
          data-testid={`remove-vote-${card.valueId}`}
          aria-label={translate(MessageKey.FinalVotingRemoveVote, {
            value: valueName,
          })}
          disabled={!card.canRemove}
          onClick={() => onRemove(card.valueId)}
        >
          −
        </button>
        <span
          className={styles.voteCount}
          data-testid={`vote-count-${card.valueId}`}
        >
          {card.voteCount}
        </span>
        <button
          type="button"
          className={styles.stepButton}
          data-testid={`add-vote-${card.valueId}`}
          aria-label={translate(MessageKey.FinalVotingAddVote, {
            value: valueName,
          })}
          disabled={!card.canAdd}
          onClick={() => onAdd(card.valueId)}
        >
          +
        </button>
      </div>
    </article>
  );
}
