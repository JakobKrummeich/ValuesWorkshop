"use client";

import {
  FormationSubState,
  type FacilitatorGroupFormationState,
} from "../../../../domain/workshopState";
import { FormationProgress } from "../../../FormationProgress";
import { GroupCard, GroupCardVariant } from "../../../GroupCard";
import styles from "./FacilitatorGroupFormationScreen.module.css";

export function FacilitatorGroupFormationScreen({
  state: { formation },
}: {
  state: FacilitatorGroupFormationState;
}) {
  if (formation.subState === FormationSubState.Forming) {
    return (
      <section className={styles.screen}>
        <FormationProgress progress={formation.progress} />
      </section>
    );
  }

  return (
    <section className={styles.screen}>
      <ul className={styles.groups}>
        {formation.groups.map((group, index) => (
          <li key={group.name.animalId}>
            <GroupCard
              name={group.name}
              memberDisplayNames={group.members.map(
                (member) => member.displayName,
              )}
              assignedValues={group.assignedValues}
              variant={GroupCardVariant.Paper}
              index={index}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
