"use client";

import {
  FormationSubState,
  type PresenterGroupFormationState,
} from "../../../../domain/workshopState";
import { FormationProgress } from "../../../FormationProgress";
import { GroupCard, GroupCardVariant } from "../../../GroupCard";
import styles from "./PresenterGroupFormationScreen.module.css";
import { usePresenterGroupFormationScreen } from "./usePresenterGroupFormationScreen";

export function PresenterGroupFormationScreen({
  state: { formation },
}: {
  state: PresenterGroupFormationState;
}) {
  const { currentPageGroups } = usePresenterGroupFormationScreen(formation);

  if (formation.subState === FormationSubState.Forming) {
    return (
      <section className={styles.screen}>
        <FormationProgress progress={formation.progress} />
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
