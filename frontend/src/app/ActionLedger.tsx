import { cssCustomProperty } from "../shared/cssCustomProperty";
import styles from "./ActionLedger.module.css";
import { actionSlabScaleOf } from "./actionSlabScale";

export enum ActionLedgerVariant {
  Rows = "rows",
  Slabs = "slabs",
}

export interface LedgerAction {
  id: string;
  text: string;
}

export function ActionLedger({
  actions,
  variant,
  stagger = false,
  actionTestId,
}: {
  actions: ReadonlyArray<LedgerAction>;
  variant: ActionLedgerVariant;
  stagger?: boolean;
  actionTestId?: string;
}) {
  const slabScale =
    variant === ActionLedgerVariant.Slabs
      ? cssCustomProperty(
          "--slab-scale",
          actionSlabScaleOf(actions.map((action) => action.text)),
        )
      : undefined;

  return (
    <ul
      className={`${styles.ledger} ${styles[variant]} ${
        stagger ? styles.staggered : ""
      }`}
      style={slabScale}
    >
      {actions.map((action, index) => (
        <li
          key={action.id}
          className={styles.action}
          data-testid={actionTestId}
          style={stagger ? cssCustomProperty("--index", index) : undefined}
        >
          {action.text}
        </li>
      ))}
    </ul>
  );
}
