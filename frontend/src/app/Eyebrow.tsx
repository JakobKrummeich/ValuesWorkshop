import type { ReactNode } from "react";
import styles from "./Eyebrow.module.css";

export enum EyebrowTone {
  Accent = "accent",
  Animal = "animal",
  Muted = "muted",
}

export function Eyebrow({
  tone,
  className,
  testId,
  children,
}: {
  tone?: EyebrowTone;
  className?: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={`${styles.eyebrow} ${tone ? styles[tone] : ""} ${
        className ?? ""
      }`}
      data-testid={testId}
    >
      {children}
    </p>
  );
}
