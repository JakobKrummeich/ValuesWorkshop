"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import {
  GroupWorkStatus,
  type OwnGroupView,
} from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./GroupWorkCard.module.css";
import { useGroupWorkCard } from "./useGroupWorkCard";

export function GroupWorkCard({ ownGroup }: { ownGroup: OwnGroupView }) {
  const { language, translate } = useTranslation();
  const {
    groupName,
    memberDisplayNames,
    scribeName,
    isCallerScribe,
    isSubmitted,
    assignedValues,
    selectedValueId,
    selectValue,
    actionsForSelectedValue,
    localTexts,
    addAction,
    editActionText,
    removeAction,
    submitGroupWork,
    reopenGroupWork,
    canSubmit,
    isSending,
  } = useGroupWorkCard(ownGroup);

  return (
    <article className={styles.card} data-testid="group-work-card">
      <div className={styles.header}>
        <h2 className={styles.groupName} data-testid="group-work-name">
          {localizedText(language, groupName.text)}
        </h2>
        <ul className={styles.members}>
          {memberDisplayNames.map((displayName, index) => (
            <li
              key={index}
              className={styles.member}
              data-testid="group-work-member"
            >
              {displayName}
            </li>
          ))}
        </ul>
        {scribeName !== null && (
          <p className={styles.scribeLabel} data-testid="group-work-scribe">
            {translate(MessageKey.GroupWorkScribeLabel, { name: scribeName })}
          </p>
        )}
      </div>
      <ul className={styles.valueTabs} role="tablist" data-testid="value-tabs">
        {assignedValues.map((value) => (
          <li key={value.valueId}>
            <button
              type="button"
              role="tab"
              className={styles.valueTab}
              aria-selected={value.valueId === selectedValueId}
              data-testid={`value-tab-${value.valueId}`}
              onClick={() => selectValue(value.valueId)}
            >
              {localizedText(language, value.text)}
            </button>
          </li>
        ))}
      </ul>
      <ul className={styles.actionList} data-testid="action-list">
        {actionsForSelectedValue.map((action) => (
          <li
            key={action.actionId}
            className={styles.actionItem}
            data-testid={`action-${action.actionId}`}
          >
            {isCallerScribe && !isSubmitted ? (
              <>
                <input
                  type="text"
                  className={styles.actionInput}
                  data-testid={`action-input-${action.actionId}`}
                  value={localTexts[action.actionId] ?? action.text}
                  placeholder={translate(MessageKey.GroupWorkActionPlaceholder)}
                  onChange={(event) =>
                    editActionText(action.actionId, event.target.value)
                  }
                />
                <button
                  type="button"
                  className={styles.removeButton}
                  data-testid={`remove-action-${action.actionId}`}
                  onClick={() => removeAction(action.actionId)}
                >
                  {translate(MessageKey.GroupWorkRemoveAction)}
                </button>
              </>
            ) : (
              <span
                className={styles.actionText}
                data-testid={`action-text-${action.actionId}`}
              >
                {action.text}
              </span>
            )}
          </li>
        ))}
      </ul>
      {isCallerScribe && !isSubmitted && (
        <button
          type="button"
          className={styles.addButton}
          data-testid="add-action-button"
          onClick={addAction}
          disabled={isSending}
        >
          {translate(MessageKey.GroupWorkAddAction)}
        </button>
      )}
      {isCallerScribe && (
        <div className={styles.controls}>
          {isSubmitted ? (
            <button
              type="button"
              className={styles.reopenButton}
              data-testid="reopen-button"
              onClick={reopenGroupWork}
              disabled={isSending}
            >
              {translate(MessageKey.GroupWorkReopen)}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.submitButton}
                data-testid="submit-group-work-button"
                disabled={!canSubmit || isSending}
                onClick={submitGroupWork}
              >
                {translate(MessageKey.GroupWorkSubmit)}
              </button>
              {!canSubmit && (
                <p
                  className={styles.disabledHint}
                  data-testid="submit-disabled-hint"
                >
                  {translate(MessageKey.GroupWorkSubmitDisabledHint)}
                </p>
              )}
            </>
          )}
        </div>
      )}
      {ownGroup.workStatus !== undefined && (
        <span
          className={`${styles.statusBadge} ${
            ownGroup.workStatus === GroupWorkStatus.Submitted
              ? styles.statusSubmitted
              : styles.statusEditing
          }`}
          data-testid="group-work-status"
        >
          {ownGroup.workStatus === GroupWorkStatus.Submitted
            ? translate(MessageKey.GroupWorkStatusSubmitted)
            : translate(MessageKey.GroupWorkStatusEditing)}
        </span>
      )}
    </article>
  );
}
