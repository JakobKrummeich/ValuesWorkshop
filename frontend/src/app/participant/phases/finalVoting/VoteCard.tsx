"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { ActionLedger, ActionLedgerVariant } from "../../../ActionLedger";
import { useTranslation } from "../../../i18n/useTranslation";
import { VoteControl } from "../../../VoteControl";
import type { VoteCardModel } from "./useParticipantFinalVotingScreen";
import { usePingOnIncrement } from "./usePingOnIncrement";
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
  const pingKey = usePingOnIncrement(card.voteCount);
  const valueName = localizedText(language, card.text);

  return (
    <article
      className={`${styles.card} ${card.voteCount > 0 ? styles.voted : ""}`}
      data-testid={`vote-card-${card.valueId}`}
    >
      {pingKey > 0 && (
        <span
          key={pingKey}
          className={styles.ping}
          data-testid={`vote-ping-${card.valueId}`}
          aria-hidden="true"
        />
      )}
      <h3 className={styles.valueName}>{valueName}</h3>
      {card.actions.length > 0 && (
        <ActionLedger
          actions={card.actions}
          variant={ActionLedgerVariant.Rows}
        />
      )}
      <div className={styles.control}>
        <VoteControl
          count={card.voteCount}
          canAdd={card.canAdd}
          canRemove={card.canRemove}
          onAdd={() => onAdd(card.valueId)}
          onRemove={() => onRemove(card.valueId)}
          addLabel={translate(MessageKey.FinalVotingAddVote, {
            value: valueName,
          })}
          removeLabel={translate(MessageKey.FinalVotingRemoveVote, {
            value: valueName,
          })}
          testIds={{
            add: `add-vote-${card.valueId}`,
            remove: `remove-vote-${card.valueId}`,
            count: `vote-count-${card.valueId}`,
          }}
        />
      </div>
    </article>
  );
}
