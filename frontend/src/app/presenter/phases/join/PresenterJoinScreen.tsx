"use client";

import { QrCodeImage } from "../../../../adapters/qrCodeImage";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresenterJoinState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresenterJoinScreen.module.css";
import { usePresenterJoinScreen } from "./usePresenterJoinScreen";

export function PresenterJoinScreen({ state }: { state: PresenterJoinState }) {
  const { translate } = useTranslation();
  const { joinUrl } = usePresenterJoinScreen();
  const displayNames = state.participantDisplayNames;

  return (
    <section className={styles.join}>
      {joinUrl !== null && (
        <figure className={styles.invitation}>
          <QrCodeImage
            payload={joinUrl}
            title={translate(MessageKey.JoinScanToJoin)}
            className={styles.qrCode}
          />
          <figcaption className={styles.callToAction}>
            {translate(MessageKey.JoinScanToJoin)}
          </figcaption>
        </figure>
      )}
      <div className={styles.lobby}>
        <p className={styles.count} data-testid="participant-count">
          {translate(MessageKey.JoinParticipantCount, {
            count: state.participantCount,
          })}
        </p>
        {displayNames.length === 0 ? (
          <p className={styles.empty}>{translate(MessageKey.JoinNobodyYet)}</p>
        ) : (
          <ul className={styles.names} data-testid="joined-names">
            {displayNames.map((displayName, position) => (
              <li className={styles.name} key={`${position}-${displayName}`}>
                {displayName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
