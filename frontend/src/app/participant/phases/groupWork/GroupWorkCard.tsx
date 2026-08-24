"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { OwnGroupView } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { ActionListItem } from "./ActionListItem";
import styles from "./GroupWorkCard.module.css";
import { GroupWorkControls } from "./GroupWorkControls";
import { useGroupWorkCard } from "./useGroupWorkCard";
import { WorkStatusBadge } from "./WorkStatusBadge";

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

  const isEditable = isCallerScribe && !isSubmitted;

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
          <ActionListItem
            key={action.actionId}
            action={action}
            isEditable={isEditable}
            localText={localTexts[action.actionId]}
            onEditText={editActionText}
            onRemove={removeAction}
          />
        ))}
      </ul>
      {isEditable && (
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
        <GroupWorkControls
          isSubmitted={isSubmitted}
          canSubmit={canSubmit}
          isSending={isSending}
          onSubmit={submitGroupWork}
          onReopen={reopenGroupWork}
        />
      )}
      {ownGroup.workStatus !== undefined && (
        <WorkStatusBadge workStatus={ownGroup.workStatus} />
      )}
    </article>
  );
}
