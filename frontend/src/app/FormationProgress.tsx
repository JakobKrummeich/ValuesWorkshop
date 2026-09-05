"use client";

import { MessageKey } from "../domain/i18n/messages";
import styles from "./FormationProgress.module.css";
import { useTranslation } from "./i18n/useTranslation";
import { ProgressRing } from "./ProgressRing";

export function FormationProgress({ progress }: { progress: number }) {
  const { translate } = useTranslation();
  const label = translate(MessageKey.GroupFormationFormingGroups);

  return (
    <div className={styles.formation} data-testid="formation-progress">
      <ProgressRing fraction={progress} label={label} />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
