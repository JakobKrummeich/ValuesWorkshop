"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantGroupFormationState } from "../../../../domain/workshopState";
import { FormationProgressBar } from "../../../FormationProgressBar";
import { GroupCard } from "../../../GroupCard";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./ParticipantGroupFormationScreen.module.css";
import { useParticipantGroupFormationScreen } from "./useParticipantGroupFormationScreen";

export function ParticipantGroupFormationScreen({
  state,
  isPhaseEntryObserved,
}: {
  state: ParticipantGroupFormationState;
  isPhaseEntryObserved: boolean;
}) {
  const { translate } = useTranslation();
  const { isFormationProgressRunning, completeFormationProgress } =
    useParticipantGroupFormationScreen(isPhaseEntryObserved);

  if (isFormationProgressRunning) {
    return (
      <section className={styles.screen}>
        <FormationProgressBar onProgressComplete={completeFormationProgress} />
      </section>
    );
  }

  if (state.ownGroup === null) {
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
        name={state.ownGroup.name}
        memberDisplayNames={state.ownGroup.memberDisplayNames}
        assignedValues={state.ownGroup.assignedValues}
      />
    </section>
  );
}
