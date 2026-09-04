"use client";

import styles from "./AdvanceGuard.module.css";
import { useAdvanceGuard } from "./useAdvanceGuard";

export function AdvanceGuard() {
  const { guardText } = useAdvanceGuard();

  if (guardText === null) {
    return null;
  }

  return (
    <p className={styles.guard} data-testid="advance-guard">
      {guardText}
    </p>
  );
}
