"use client";

import type { ReactNode } from "react";
import type { PresenterGroup } from "../../domain/workshopState";
import { GroupCard, GroupCardVariant } from "../GroupCard";
import styles from "./PresenterGroupGrid.module.css";

export function PresenterGroupGrid({
  pageIndex,
  groups,
  statusOf,
}: {
  pageIndex: number;
  groups: readonly PresenterGroup[];
  statusOf?: (group: PresenterGroup) => ReactNode;
}) {
  return (
    <div className={styles.grid}>
      <div key={pageIndex} className={styles.page}>
        {groups.map((group, index) => (
          <GroupCard
            key={group.name.animalId}
            name={group.name}
            memberDisplayNames={group.memberDisplayNames}
            assignedValues={group.assignedValues}
            variant={GroupCardVariant.Wall}
            index={index}
            status={statusOf?.(group)}
          />
        ))}
      </div>
    </div>
  );
}
