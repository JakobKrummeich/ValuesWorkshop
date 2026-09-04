"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantJoinState } from "../../../../domain/workshopState";
import { Counter, CounterSize, CounterVariant } from "../../../Counter";
import { useTranslation } from "../../../i18n/useTranslation";
import { WaitingScreen } from "../../../WaitingScreen";
import styles from "./ParticipantJoinScreen.module.css";

export function ParticipantJoinScreen({
  state,
}: {
  state: ParticipantJoinState;
}) {
  const { translate } = useTranslation();

  return (
    <WaitingScreen
      heading={MessageKey.JoinYouAreIn}
      headingParameters={{ name: state.ownDisplayName }}
      headingTestId="own-display-name"
      body={MessageKey.JoinWaitingForStart}
    >
      <p className="visuallyHidden" data-testid="participant-count">
        {translate(MessageKey.JoinParticipantCount, {
          count: state.participantCount,
        })}
      </p>
      <div className={styles.counter}>
        <Counter
          value={state.participantCount}
          suffix={translate(MessageKey.JoinJoined)}
          variant={CounterVariant.Phone}
          size={CounterSize.Giant}
        />
      </div>
    </WaitingScreen>
  );
}
