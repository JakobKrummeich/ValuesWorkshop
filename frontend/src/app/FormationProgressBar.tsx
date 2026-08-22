"use client";

import { MessageKey } from "../domain/i18n/messages";
import styles from "./FormationProgressBar.module.css";
import { useTranslation } from "./i18n/useTranslation";

export function FormationProgressBar() {
  const { translate } = useTranslation();

  const label = translate(MessageKey.GroupFormationFormingGroups);

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={label}
      data-testid="formation-progress"
    >
      <p className={styles.label}>{label}</p>
      <div className={styles.track}>
        <div className={styles.fill} />
      </div>
    </div>
  );
}
