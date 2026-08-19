"use client";

import type { FacilitatorGroupFormationState } from "../../../../domain/workshopState";
import { GroupCard } from "../../../GroupCard";
import styles from "./FacilitatorGroupFormationScreen.module.css";

export function FacilitatorGroupFormationScreen({
  state,
}: {
  state: FacilitatorGroupFormationState;
}) {
  return (
    <section className={styles.screen}>
      <ul className={styles.groups}>
        {state.groups.map((group) => (
          <li key={group.name.animalId}>
            <GroupCard
              name={group.name}
              memberDisplayNames={group.members.map(
                (member) => member.displayName,
              )}
              assignedValues={group.assignedValues}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
