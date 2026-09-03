"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresenterJoinState } from "../../../../domain/workshopState";
import { Counter, CounterSize, CounterVariant } from "../../../Counter";
import { useTranslation } from "../../../i18n/useTranslation";
import { JoinInvitation } from "./JoinInvitation";
import { JoinRoster } from "./JoinRoster";
import styles from "./PresenterJoinScreen.module.css";
import { usePresenterJoinScreen } from "./usePresenterJoinScreen";

export function PresenterJoinScreen({ state }: { state: PresenterJoinState }) {
  const { translate } = useTranslation();
  const { joinUrl, pingKey, visibleNames, hiddenCount } =
    usePresenterJoinScreen(state);

  return (
    <section className={styles.screen}>
      {joinUrl !== null && (
        <JoinInvitation joinUrl={joinUrl} pingKey={pingKey} />
      )}
      <p className="visuallyHidden" data-testid="participant-count">
        {translate(MessageKey.JoinParticipantCount, {
          count: state.participantCount,
        })}
      </p>
      <Counter
        value={state.participantCount}
        suffix={translate(MessageKey.JoinJoined)}
        variant={CounterVariant.Wall}
        size={CounterSize.Display}
      />
      <JoinRoster visibleNames={visibleNames} hiddenCount={hiddenCount} />
    </section>
  );
}
