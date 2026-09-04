import styles from "./Pips.module.css";

export function Pips({
  filled,
  total,
  testId,
}: {
  filled: number;
  total: number;
  testId?: string;
}) {
  return (
    <span className={styles.pips} data-testid={testId} aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={styles.pip} data-filled={index < filled} />
      ))}
    </span>
  );
}
