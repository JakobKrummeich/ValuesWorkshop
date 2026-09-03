"use client";

import type { PresenterGroupWorkState } from "../../../../domain/workshopState";
import { GroupWorkStatusPill } from "../../../GroupWorkStatusPill";
import { PresenterGroupGrid } from "../../PresenterGroupGrid";
import { useGroupPages } from "../../useGroupPages";
import styles from "./PresenterGroupWorkScreen.module.css";

export function PresenterGroupWorkScreen({
  state,
}: {
  state: PresenterGroupWorkState;
}) {
  const { pageIndex, currentPageGroups } = useGroupPages(state.groups);

  return (
    <section className={styles.screen}>
      <PresenterGroupGrid
        pageIndex={pageIndex}
        groups={currentPageGroups}
        statusOf={(group) =>
          group.workStatus === undefined ? undefined : (
            <GroupWorkStatusPill
              workStatus={group.workStatus}
              testId={`presenter-group-status-${group.name.animalId}`}
            />
          )
        }
      />
    </section>
  );
}
