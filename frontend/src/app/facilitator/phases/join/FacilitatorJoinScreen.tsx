"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorJoinState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./FacilitatorJoinScreen.module.css";
import { useFacilitatorJoinScreen } from "./useFacilitatorJoinScreen";

export function FacilitatorJoinScreen({
  state,
}: {
  state: FacilitatorJoinState;
}) {
  const { translate } = useTranslation();
  const { joinUrl, copyOutcome, copyJoinUrl } = useFacilitatorJoinScreen();

  return (
    <section className={styles.join}>
      <div className={styles.invitation}>
        <button
          type="button"
          className={styles.copyButton}
          disabled={joinUrl === null}
          onClick={copyJoinUrl}
        >
          {translate(MessageKey.JoinCopyUrl)}
        </button>
        {copyOutcome !== null && (
          <p className={styles.copyOutcome} role="status">
            {translate(copyOutcome)}
          </p>
        )}
      </div>
      <h2 className={styles.rosterHeading}>
        {translate(MessageKey.JoinAlreadyHere)}
      </h2>
      <p className={styles.count} data-testid="participant-count">
        {translate(MessageKey.JoinParticipantCount, {
          count: state.roster.participantCount,
        })}
      </p>
      {state.roster.participants.length === 0 ? (
        <p className={styles.empty}>{translate(MessageKey.JoinNobodyYet)}</p>
      ) : (
        <ul className={styles.names} data-testid="joined-names">
          {state.roster.participants.map((participant) => (
            <li className={styles.name} key={participant.participantId}>
              {participant.displayName}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
