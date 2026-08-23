"use client";

import {
  FormationSubState,
  type ParticipantGroupFormationState,
} from "../../../../domain/workshopState";
import { FormationProgressBar } from "../../../FormationProgressBar";
import { GroupCard } from "../../../GroupCard";
import styles from "./ParticipantGroupFormationScreen.module.css";

export function ParticipantGroupFormationScreen({
  state: { formation },
}: {
  state: ParticipantGroupFormationState;
}) {
  if (formation.subState === FormationSubState.Forming) {
    return (
      <section className={styles.screen}>
        <FormationProgressBar progress={formation.progress} />
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="own-group-card">
      <GroupCard
        name={formation.ownGroup.name}
        memberDisplayNames={formation.ownGroup.memberDisplayNames}
        assignedValues={formation.ownGroup.assignedValues}
      />
    </section>
  );
}
