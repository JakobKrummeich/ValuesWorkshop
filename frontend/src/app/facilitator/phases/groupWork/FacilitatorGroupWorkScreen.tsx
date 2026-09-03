"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import {
  GroupWorkStatus,
  type FacilitatorGroupWorkState,
} from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./FacilitatorGroupWorkScreen.module.css";
import { useFacilitatorGroupWorkScreen } from "./useFacilitatorGroupWorkScreen";

export function FacilitatorGroupWorkScreen({
  state,
}: {
  state: FacilitatorGroupWorkState;
}) {
  const { language, translate } = useTranslation();
  const { groups, reassignScribe } = useFacilitatorGroupWorkScreen(state);

  return (
    <section
      className={styles.screen}
      data-testid="facilitator-group-work-screen"
    >
      <table className={styles.table} data-testid="group-work-table">
        <thead>
          <tr>
            <th className={styles.headerCell}>
              {translate(MessageKey.GroupWorkGroupName)}
            </th>
            <th className={styles.headerCell}>
              {translate(MessageKey.GroupWorkScribe)}
            </th>
            <th className={styles.headerCell}>
              {translate(MessageKey.GroupWorkActions)}
            </th>
            <th className={styles.headerCell}>
              {translate(MessageKey.GroupWorkStatus)}
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const totalActions = group.actionCountPerValue
              ? Object.values(group.actionCountPerValue).reduce(
                  (sum, count) => sum + count,
                  0,
                )
              : 0;
            return (
              <tr
                key={group.name.animalId}
                data-testid={`group-row-${group.name.animalId}`}
              >
                <td className={styles.cell} data-testid="group-row-name">
                  {localizedText(language, group.name.text)}
                </td>
                <td className={styles.cell}>
                  <select
                    className={styles.scribeSelect}
                    data-testid={`scribe-select-${group.name.animalId}`}
                    value={group.scribeParticipantId ?? ""}
                    onChange={(event) => reassignScribe(event.target.value)}
                  >
                    {group.members.map((member) => (
                      <option
                        key={member.participantId}
                        value={member.participantId}
                      >
                        {member.displayName}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  className={styles.cell}
                  data-testid="group-row-action-count"
                >
                  {totalActions}
                </td>
                <td className={styles.cell}>
                  <span
                    className={`${styles.statusBadge} ${
                      group.workStatus === GroupWorkStatus.Submitted
                        ? styles.statusSubmitted
                        : styles.statusEditing
                    }`}
                    data-testid={`group-status-${group.name.animalId}`}
                  >
                    {group.workStatus === GroupWorkStatus.Submitted
                      ? translate(MessageKey.GroupWorkStatusSubmitted)
                      : translate(MessageKey.GroupWorkStatusEditing)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
