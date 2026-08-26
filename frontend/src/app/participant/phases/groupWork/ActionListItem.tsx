"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { GroupActionView } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./GroupWorkCard.module.css";

export function ActionListItem({
  action,
  isEditable,
  localText,
  onEditText,
  onRemove,
}: {
  action: GroupActionView;
  isEditable: boolean;
  localText: string | undefined;
  onEditText: (actionId: string, text: string) => void;
  onRemove: (actionId: string) => void;
}) {
  const { translate } = useTranslation();

  if (isEditable) {
    return (
      <li
        className={styles.actionItem}
        data-testid={`action-${action.actionId}`}
      >
        <input
          type="text"
          className={styles.actionInput}
          data-testid={`action-input-${action.actionId}`}
          value={localText ?? action.text}
          placeholder={translate(MessageKey.GroupWorkActionPlaceholder)}
          onChange={(event) => onEditText(action.actionId, event.target.value)}
        />
        <button
          type="button"
          className={styles.removeButton}
          data-testid={`remove-action-${action.actionId}`}
          onClick={() => onRemove(action.actionId)}
        >
          {translate(MessageKey.GroupWorkRemoveAction)}
        </button>
      </li>
    );
  }

  return (
    <li className={styles.actionItem} data-testid={`action-${action.actionId}`}>
      <span
        className={styles.actionText}
        data-testid={`action-text-${action.actionId}`}
      >
        {action.text}
      </span>
    </li>
  );
}
