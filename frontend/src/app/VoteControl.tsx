import styles from "./VoteControl.module.css";

export interface VoteControlTestIds {
  add: string;
  remove: string;
  count: string;
}

export function VoteControl({
  count,
  canAdd,
  canRemove,
  onAdd,
  onRemove,
  addLabel,
  removeLabel,
  testIds,
}: {
  count: number;
  canAdd: boolean;
  canRemove: boolean;
  onAdd: () => void;
  onRemove: () => void;
  addLabel: string;
  removeLabel: string;
  testIds?: VoteControlTestIds;
}) {
  return (
    <div className={styles.control}>
      <button
        type="button"
        className={styles.button}
        aria-label={removeLabel}
        disabled={!canRemove}
        onClick={onRemove}
        data-testid={testIds?.remove}
      >
        −
      </button>
      <span className={styles.count} data-testid={testIds?.count}>
        {count}
      </span>
      <button
        type="button"
        className={`${styles.button} ${styles.add}`}
        aria-label={addLabel}
        disabled={!canAdd}
        onClick={onAdd}
        data-testid={testIds?.add}
      >
        +
      </button>
    </div>
  );
}
