"use client";

import type { ReactNode, Ref } from "react";
import styles from "./CallToAction.module.css";

export enum CallToActionVariant {
  Primary = "primary",
  Ghost = "ghost",
}

export function CallToAction({
  variant = CallToActionVariant.Primary,
  disabled = false,
  onClick,
  testId,
  buttonRef,
  children,
}: {
  variant?: CallToActionVariant;
  disabled?: boolean;
  onClick: () => void;
  testId: string;
  buttonRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]}`}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      ref={buttonRef}
    >
      {children}
    </button>
  );
}
