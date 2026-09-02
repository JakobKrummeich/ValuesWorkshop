"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import {
  FormationSubState,
  type PresenterGroupFormationState,
} from "../../../../domain/workshopState";
import { GroupCard, GroupCardVariant } from "../../../GroupCard";
import { useTranslation } from "../../../i18n/useTranslation";
import { ProgressRing } from "../../../ProgressRing";
import styles from "./PresenterGroupFormationScreen.module.css";
import { usePresenterGroupFormationScreen } from "./usePresenterGroupFormationScreen";

export function PresenterGroupFormationScreen({
  state: { formation },
}: {
  state: PresenterGroupFormationState;
}) {
  const { translate } = useTranslation();
  const { currentPageGroups } = usePresenterGroupFormationScreen(formation);

  if (formation.subState === FormationSubState.Forming) {
    return (
      <section className={styles.screen}>
        <ProgressRing
          fraction={formation.progress}
          label={translate(MessageKey.GroupFormationFormingGroups)}
          testId="formation-progress"
        />
      </section>
    );
  }

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
          />
        ))}
      </div>
    </section>
  );
}
