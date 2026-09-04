"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./ActionBar.module.css";
import { useActionBarSlot } from "./actionBarSlot";

export function ActionBar({
  hint,
  hintTestId,
  children,
}: {
  hint?: string;
  hintTestId?: string;
  children: ReactNode;
}) {
  const slot = useActionBarSlot();
  const bar = (
    <div className={styles.bar}>
      {hint !== undefined && (
        <p className={styles.hint} data-testid={hintTestId}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );

  return slot === null ? bar : createPortal(bar, slot);
}
