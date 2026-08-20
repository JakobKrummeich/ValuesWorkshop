"use client";

import type { PresenterGroupFormationState } from "../../../../domain/workshopState";
import { GroupCard } from "../../../GroupCard";
import styles from "./PresenterGroupFormationScreen.module.css";
import { usePresenterGroupFormationScreen } from "./usePresenterGroupFormationScreen";

export function PresenterGroupFormationScreen({
  state,
}: {
  state: PresenterGroupFormationState;
}) {
  const { currentPageGroups } = usePresenterGroupFormationScreen(state.groups);

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
