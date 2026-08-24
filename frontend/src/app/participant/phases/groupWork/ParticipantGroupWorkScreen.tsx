"use client";

import type { ParticipantGroupWorkState } from "../../../../domain/workshopState";
import styles from "./ParticipantGroupWorkScreen.module.css";
import { GroupWorkCard } from "./GroupWorkCard";

export function ParticipantGroupWorkScreen({
  state,
}: {
  state: ParticipantGroupWorkState;
}) {
  if (state.ownGroup === null) {
    return null;
  }

  return (
    <section
      className={styles.screen}
      data-testid="participant-group-work-screen"
    >
      <GroupWorkCard ownGroup={state.ownGroup} />
    </section>
  );
}
