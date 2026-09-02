"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import {
  FormationSubState,
  type ParticipantGroupFormationState,
} from "../../../../domain/workshopState";
import { GroupCard, GroupCardVariant } from "../../../GroupCard";
import { useTranslation } from "../../../i18n/useTranslation";
import { ProgressRing } from "../../../ProgressRing";
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
        <ProgressRing
          fraction={formation.progress}
          label={translate(MessageKey.GroupFormationFormingGroups)}
          testId="formation-progress"
        />
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="own-group-card">
      <GroupCard
        name={formation.ownGroup.name}
        memberDisplayNames={formation.ownGroup.memberDisplayNames}
        assignedValues={formation.ownGroup.assignedValues}
        variant={GroupCardVariant.Phone}
      />
    </section>
  );
}
