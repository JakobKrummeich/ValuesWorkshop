"use client";

import {
  FormationSubState,
  type PresenterGroupFormationState,
} from "../../../../domain/workshopState";
import { FormationProgress } from "../../../FormationProgress";
import { PresenterGroupGrid } from "../../PresenterGroupGrid";
import styles from "./PresenterGroupFormationScreen.module.css";
import { usePresenterGroupFormationScreen } from "./usePresenterGroupFormationScreen";

export function PresenterGroupFormationScreen({
  state: { formation },
}: {
  state: PresenterGroupFormationState;
}) {
  const { pageIndex, currentPageGroups } =
    usePresenterGroupFormationScreen(formation);

  if (formation.subState === FormationSubState.Forming) {
    return (
      <section className={styles.forming}>
        <FormationProgress progress={formation.progress} />
      </section>
    );
  }

  return (
    <section className={styles.screen}>
      <PresenterGroupGrid pageIndex={pageIndex} groups={currentPageGroups} />
    </section>
  );
}
