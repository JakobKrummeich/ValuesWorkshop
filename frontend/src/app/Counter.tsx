"use client";

import styles from "./Counter.module.css";
import { useCountUp } from "./useCountUp";

export enum CounterVariant {
  Wall = "wall",
  Phone = "phone",
  Laptop = "laptop",
}

export function Counter({
  value,
  suffix,
  variant,
  testId,
}: {
  value: number;
  suffix?: string;
  variant: CounterVariant;
  testId?: string;
}) {
  const displayed = useCountUp(value);

  return (
    <p className={`${styles.counter} ${styles[variant]}`} data-testid={testId}>
      <span className={styles.value}>{displayed}</span>
      {suffix !== undefined && (
        <>
          {" "}
          <span className={styles.suffix}>{suffix}</span>
        </>
      )}
    </p>
  );
}
