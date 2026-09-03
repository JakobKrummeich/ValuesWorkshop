"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { GroupActionView } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./ActionListItem.module.css";

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
      <li className={styles.row} data-testid={`action-${action.actionId}`}>
        <input
          type="text"
          className={styles.input}
          data-testid={`action-input-${action.actionId}`}
          value={localText ?? action.text}
          placeholder={translate(MessageKey.GroupWorkActionPlaceholder)}
          onChange={(event) => onEditText(action.actionId, event.target.value)}
        />
        <button
          type="button"
          className={styles.remove}
          data-testid={`remove-action-${action.actionId}`}
          aria-label={translate(MessageKey.GroupWorkRemoveAction)}
          onClick={() => onRemove(action.actionId)}
        >
          <span aria-hidden="true">×</span>
        </button>
      </li>
    );
  }

  return (
    <li className={styles.row} data-testid={`action-${action.actionId}`}>
      <span
        className={styles.text}
        data-testid={`action-text-${action.actionId}`}
      >
        {action.text}
      </span>
    </li>
  );
}
