"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { cssCustomProperty } from "../../../../shared/cssCustomProperty";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./JoinRoster.module.css";
import type { RosterName } from "./usePresenterJoinScreen";

export function JoinRoster({
  visibleNames,
  hiddenCount,
}: {
  visibleNames: readonly RosterName[];
  hiddenCount: number;
}) {
  const { translate } = useTranslation();

  if (visibleNames.length === 0) {
    return (
      <p className={styles.empty}>{translate(MessageKey.JoinNobodyYet)}</p>
    );
  }

  return (
    <ul className={styles.names} data-testid="joined-names">
      {visibleNames.map(({ name, isNewest }, index) => (
        <li
          key={`${index}-${name}`}
          className={isNewest ? `${styles.name} ${styles.newest}` : styles.name}
          style={cssCustomProperty("--index", index)}
        >
          {name}
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className={`${styles.name} ${styles.more}`}>
          {translate(MessageKey.JoinMoreNames, { count: hiddenCount })}
        </li>
      )}
    </ul>
  );
}
