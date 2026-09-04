"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { OwnGroupView } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { ActionListItem } from "./ActionListItem";
import styles from "./GroupWorkCard.module.css";
import { GroupWorkControls } from "./GroupWorkControls";
import { GroupWorkHeader } from "./GroupWorkHeader";
import { useGroupWorkCard } from "./useGroupWorkCard";
import { ValueTabs } from "./ValueTabs";

export function GroupWorkCard({ ownGroup }: { ownGroup: OwnGroupView }) {
  const { translate } = useTranslation();
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
    rejectionMessage,
  } = useGroupWorkCard(ownGroup);

  const isEditable = isCallerScribe && !isSubmitted;
  const showsEmptyNote = !isEditable && actionsForSelectedValue.length === 0;

  return (
    <article
      className={styles.card}
      data-testid="group-work-card"
      data-animal={groupName.animalId}
    >
      <GroupWorkHeader
        groupName={groupName}
        memberDisplayNames={memberDisplayNames}
        scribeName={scribeName}
        isCallerScribe={isCallerScribe}
        workStatus={ownGroup.workStatus}
      />
      <ValueTabs
        values={assignedValues}
        selectedValueId={selectedValueId}
        onSelect={selectValue}
      />
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
      {showsEmptyNote && (
        <p className={styles.emptyNote} data-testid="group-work-empty">
          {translate(MessageKey.GroupWorkNoActionsYet)}
        </p>
      )}
      {isEditable && (
        <button
          type="button"
          className={styles.addButton}
          data-testid="add-action-button"
          onClick={addAction}
          disabled={isSending}
        >
          <span aria-hidden="true">+</span>
          {translate(MessageKey.GroupWorkAddAction)}
        </button>
      )}
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
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
    </article>
  );
}
