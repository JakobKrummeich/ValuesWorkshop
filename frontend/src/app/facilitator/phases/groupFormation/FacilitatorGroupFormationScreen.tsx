"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import {
  FormationSubState,
  type FacilitatorGroupFormationState,
} from "../../../../domain/workshopState";
import { GroupCard, GroupCardVariant } from "../../../GroupCard";
import { useTranslation } from "../../../i18n/useTranslation";
import { ProgressRing } from "../../../ProgressRing";
import styles from "./FacilitatorGroupFormationScreen.module.css";

export function FacilitatorGroupFormationScreen({
  state: { formation },
}: {
  state: FacilitatorGroupFormationState;
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
