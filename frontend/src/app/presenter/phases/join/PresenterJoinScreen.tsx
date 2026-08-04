"use client";

import { participantJoinUrl } from "../../../../adapters/browserLocation";
import { QrCodeImage } from "../../../../adapters/qrCodeImage";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresenterJoinState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresenterJoinScreen.module.css";

export function PresenterJoinScreen({ state }: { state: PresenterJoinState }) {
  const { translate } = useTranslation();
  const joinUrl = participantJoinUrl();

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
        {state.participantDisplayNames.length === 0 ? (
          <p className={styles.empty}>{translate(MessageKey.JoinNobodyYet)}</p>
        ) : (
          <ul className={styles.names} data-testid="joined-names">
            {state.participantDisplayNames.map((displayName, position) => (
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
