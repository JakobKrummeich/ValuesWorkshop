"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorJoinState } from "../../../../domain/workshopState";
import { Eyebrow } from "../../../Eyebrow";
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
        <p className={styles.copyOutcome} role="status">
          {copyOutcome !== null && translate(copyOutcome)}
        </p>
      </div>
      <div className={styles.rosterHeader}>
        <Eyebrow>{translate(MessageKey.JoinAlreadyHere)}</Eyebrow>
        <p className={styles.count} data-testid="participant-count">
          {translate(MessageKey.JoinParticipantCount, {
            count: state.roster.participantCount,
          })}
        </p>
      </div>
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
