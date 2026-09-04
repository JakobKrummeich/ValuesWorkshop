"use client";

import type { PresenterGroupWorkState } from "../../../../domain/workshopState";
import { PresenterGroupGrid } from "../../PresenterGroupGrid";
import { useGroupPages } from "../../useGroupPages";
import { GroupWorkStatusPill } from "./GroupWorkStatusPill";
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
              animalId={group.name.animalId}
              workStatus={group.workStatus}
            />
          )
        }
      />
    </section>
  );
}
