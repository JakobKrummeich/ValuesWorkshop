"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import {
  FormationSubState,
  type ParticipantGroupFormationState,
} from "../../../../domain/workshopState";
import { FormationProgressBar } from "../../../FormationProgressBar";
import { GroupCard } from "../../../GroupCard";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./ParticipantGroupFormationScreen.module.css";

export function ParticipantGroupFormationScreen({
  state: { formation },
}: {
  state: ParticipantGroupFormationState;
}) {
  const { translate } = useTranslation();

  if (formation.subState === FormationSubState.Forming) {
    return (
      <section className={styles.screen}>
        <FormationProgressBar progress={formation.progress} />
      </section>
    );
  }

  if (formation.ownGroup === null) {
    return (
      <section className={styles.screen}>
        <p className={styles.waitingNote} data-testid="own-group-waiting">
          {translate(MessageKey.GroupFormationWaitingForGroup)}
        </p>
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
