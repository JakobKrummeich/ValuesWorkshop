import type { ReactNode } from "react";
import styles from "./ControlButton.module.css";

export function ControlButton({
  testId,
  isDisabled = false,
  onClick,
  children,
}: {
  testId: string;
  isDisabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={styles.button}
      data-testid={testId}
      disabled={isDisabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
