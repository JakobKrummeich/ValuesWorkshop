import styles from "./VotePips.module.css";

export function VotePips({ used, total }: { used: number; total: number }) {
  return (
    <span className={styles.pips} data-testid="vote-pips" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={styles.pip} data-filled={index < used} />
      ))}
    </span>
  );
}
