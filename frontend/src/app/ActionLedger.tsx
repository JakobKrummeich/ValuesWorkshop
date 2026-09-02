import { cssCustomProperty } from "../shared/cssCustomProperty";
import styles from "./ActionLedger.module.css";

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
  return (
    <ul
      className={`${styles.ledger} ${styles[variant]} ${
        stagger ? styles.staggered : ""
      }`}
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
