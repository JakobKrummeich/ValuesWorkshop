"use client";

import type { PresenterGroupFormationState } from "../../../../domain/workshopState";
import { FormationProgressBar } from "../../../FormationProgressBar";
import { GroupCard } from "../../../GroupCard";
import styles from "./PresenterGroupFormationScreen.module.css";
import { usePresenterGroupFormationScreen } from "./usePresenterGroupFormationScreen";

export function PresenterGroupFormationScreen({
  state,
  isPhaseEntryObserved,
}: {
  state: PresenterGroupFormationState;
  isPhaseEntryObserved: boolean;
}) {
  const {
    isFormationProgressRunning,
    completeFormationProgress,
    currentPageGroups,
  } = usePresenterGroupFormationScreen(state.groups, isPhaseEntryObserved);

  if (isFormationProgressRunning) {
    return (
      <section className={styles.progressScreen}>
        <FormationProgressBar onProgressComplete={completeFormationProgress} />
      </section>
    );
  }

  return (
    <section className={styles.screen}>
      <div className={styles.grid}>
        {currentPageGroups.map((group) => (
          <GroupCard
            key={group.name.animalId}
            name={group.name}
            memberDisplayNames={group.memberDisplayNames}
            assignedValues={group.assignedValues}
          />
        ))}
      </div>
    </section>
  );
}
