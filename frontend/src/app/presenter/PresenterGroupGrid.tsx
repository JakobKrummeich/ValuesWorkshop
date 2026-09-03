"use client";

import type { ReactNode } from "react";
import type { GroupName, WorkshopValue } from "../../domain/workshopState";
import { GroupCard, GroupCardVariant } from "../GroupCard";
import styles from "./PresenterGroupGrid.module.css";

export interface PresentedGroup {
  name: GroupName;
  memberDisplayNames: string[];
  assignedValues: WorkshopValue[];
}

export function PresenterGroupGrid<TGroup extends PresentedGroup>({
  pageIndex,
  groups,
  statusOf,
}: {
  pageIndex: number;
  groups: readonly TGroup[];
  statusOf?: (group: TGroup) => ReactNode;
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
