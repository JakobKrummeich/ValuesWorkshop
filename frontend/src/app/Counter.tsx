"use client";

import styles from "./Counter.module.css";
import { Eyebrow, EyebrowTone } from "./Eyebrow";
import { useCountUp } from "./useCountUp";

export enum CounterVariant {
  Wall = "wall",
  Phone = "phone",
  Laptop = "laptop",
}

export enum CounterSize {
  Giant = "giant",
  Display = "display",
}

export function Counter({
  value,
  suffix,
  variant,
  size,
  testId,
}: {
  value: number;
  suffix?: string;
  variant: CounterVariant;
  size: CounterSize;
  testId?: string;
}) {
  const displayed = useCountUp(value);

  return (
    <div
      className={`${styles.counter} ${styles[variant]} ${styles[size]}`}
      data-testid={testId}
    >
      <span className={styles.value}>{displayed}</span>
      {suffix !== undefined && (
        <>
          {" "}
          <Eyebrow tone={EyebrowTone.Muted}>{suffix}</Eyebrow>
        </>
      )}
    </div>
  );
}
