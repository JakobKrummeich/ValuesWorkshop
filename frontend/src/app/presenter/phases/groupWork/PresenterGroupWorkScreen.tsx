"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import {
  GroupWorkStatus,
  type PresenterGroupWorkState,
} from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { GroupCard, GroupCardVariant } from "../../../GroupCard";
import styles from "./PresenterGroupWorkScreen.module.css";
import { usePresenterGroupWorkScreen } from "./usePresenterGroupWorkScreen";

export function PresenterGroupWorkScreen({
  state,
}: {
  state: PresenterGroupWorkState;
}) {
  const { translate } = useTranslation();
  const { currentPageGroups } = usePresenterGroupWorkScreen(state.groups);

  return (
    <section className={styles.screen}>
      <div className={styles.grid}>
        {currentPageGroups.map((group, index) => (
          <GroupCard
            key={group.name.animalId}
            name={group.name}
            memberDisplayNames={group.memberDisplayNames}
            assignedValues={group.assignedValues}
            variant={GroupCardVariant.Wall}
            index={index}
            status={
              group.workStatus === undefined ? undefined : (
                <span
                  className={`${styles.statusBadge} ${
                    group.workStatus === GroupWorkStatus.Submitted
                      ? styles.statusSubmitted
                      : styles.statusEditing
                  }`}
                  data-testid={`presenter-group-status-${group.name.animalId}`}
                >
                  {group.workStatus === GroupWorkStatus.Submitted
                    ? translate(MessageKey.GroupWorkStatusSubmitted)
                    : translate(MessageKey.GroupWorkStatusEditing)}
                </span>
              )
            }
          />
        ))}
      </div>
    </section>
  );
}
