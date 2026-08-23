"use client";

import type { CSSProperties } from "react";
import { MessageKey } from "../domain/i18n/messages";
import styles from "./FormationProgressBar.module.css";
import { useTranslation } from "./i18n/useTranslation";

function progressFraction(progress: number): CSSProperties {
  return { "--progress-fraction": progress } as CSSProperties;
}

export function FormationProgressBar({ progress }: { progress: number }) {
  const { translate } = useTranslation();

  const label = translate(MessageKey.GroupFormationFormingGroups);

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(progress * 100)}
      data-testid="formation-progress"
    >
      <p className={styles.label}>{label}</p>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={progressFraction(progress)}
          data-testid="formation-progress-fill"
        />
      </div>
    </div>
  );
}
