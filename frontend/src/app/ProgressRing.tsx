import { cssCustomProperty } from "../shared/cssCustomProperty";
import styles from "./ProgressRing.module.css";

export function ProgressRing({
  fraction,
  label,
  testId,
}: {
  fraction: number;
  label: string;
  testId?: string;
}) {
  const percentage = Math.round(fraction * 100);

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percentage}
      data-testid={testId}
    >
      <div
        className={styles.ring}
        style={cssCustomProperty("--ring-fraction", fraction)}
      >
        <span className={styles.percentage}>{percentage}%</span>
      </div>
    </div>
  );
}
