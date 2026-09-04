"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorGroupWorkState } from "../../../../domain/workshopState";
import { AnimalGlyph } from "../../../AnimalGlyph";
import { GroupWorkStatusPill } from "../../../GroupWorkStatusPill";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./FacilitatorGroupWorkScreen.module.css";
import { useFacilitatorGroupWorkScreen } from "./useFacilitatorGroupWorkScreen";

export function FacilitatorGroupWorkScreen({
  state,
}: {
  state: FacilitatorGroupWorkState;
}) {
  const { language, translate } = useTranslation();
  const { rows, reassignScribe } = useFacilitatorGroupWorkScreen(state);

  return (
    <section
      className={styles.screen}
      data-testid="facilitator-group-work-screen"
    >
      <div className={styles.sheet}>
        <table className={styles.table} data-testid="group-work-table">
          <thead>
            <tr>
              <th className={styles.headerCell}>
                {translate(MessageKey.GroupWorkGroupName)}
              </th>
              <th className={styles.headerCell}>
                {translate(MessageKey.GroupWorkScribe)}
              </th>
              <th className={`${styles.headerCell} ${styles.numeric}`}>
                {translate(MessageKey.GroupWorkActions)}
              </th>
              <th className={styles.headerCell}>
                {translate(MessageKey.GroupWorkStatus)}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name.animalId}
                className={styles.row}
                data-testid={`group-row-${row.name.animalId}`}
                data-animal={row.name.animalId}
              >
                <td className={styles.cell}>
                  <span className={styles.group}>
                    <span className={styles.badge}>
                      <AnimalGlyph animalId={row.name.animalId} />
                    </span>
                    <span className={styles.name} data-testid="group-row-name">
                      {localizedText(language, row.name.text)}
                    </span>
                  </span>
                </td>
                <td className={styles.cell}>
                  <span className={styles.selectFrame}>
                    <select
                      className={styles.scribeSelect}
                      data-testid={`scribe-select-${row.name.animalId}`}
                      aria-label={translate(MessageKey.GroupWorkScribe)}
                      value={row.scribeParticipantId}
                      onChange={(event) => reassignScribe(event.target.value)}
                    >
                      {row.members.map((member) => (
                        <option
                          key={member.participantId}
                          value={member.participantId}
                        >
                          {member.displayName}
                        </option>
                      ))}
                    </select>
                  </span>
                </td>
                <td
                  className={`${styles.cell} ${styles.numeric}`}
                  data-testid="group-row-action-count"
                >
                  {row.actionCount}
                </td>
                <td className={styles.cell}>
                  <GroupWorkStatusPill
                    workStatus={row.workStatus}
                    testId={`group-status-${row.name.animalId}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
