"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantJoinState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./ParticipantJoinScreen.module.css";

export function ParticipantJoinScreen({
  state,
}: {
  state: ParticipantJoinState;
}) {
  const { translate } = useTranslation();

  return (
    <section className={styles.lobby}>
      <p className={styles.welcome} data-testid="own-display-name">
        {translate(MessageKey.JoinYouAreIn, { name: state.ownDisplayName })}
      </p>
      <p className={styles.waiting}>
        {translate(MessageKey.JoinWaitingForStart)}
      </p>
      <p className={styles.count} data-testid="participant-count">
        {translate(MessageKey.JoinParticipantCount, {
          count: state.participantCount,
        })}
      </p>
    </section>
  );
}
