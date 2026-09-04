"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import {
  FormationSubState,
  type ParticipantGroupFormationState,
} from "../../../../domain/workshopState";
import { Eyebrow, EyebrowTone } from "../../../Eyebrow";
import { FormationProgress } from "../../../FormationProgress";
import { GroupCard, GroupCardVariant } from "../../../GroupCard";
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
        <FormationProgress progress={formation.progress} />
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="own-group-card">
      <Eyebrow tone={EyebrowTone.Accent} className={styles.eyebrow}>
        {translate(MessageKey.GroupFormationYourGroup)}
      </Eyebrow>
      <GroupCard
        name={formation.ownGroup.name}
        memberDisplayNames={formation.ownGroup.memberDisplayNames}
        assignedValues={formation.ownGroup.assignedValues}
        variant={GroupCardVariant.Phone}
      />
      <p className={styles.hint}>
        {translate(MessageKey.GroupFormationFindEachOther)}
      </p>
    </section>
  );
}
