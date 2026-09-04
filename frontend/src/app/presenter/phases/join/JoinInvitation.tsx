"use client";

import { QrCodeImage } from "../../../../adapters/qrCodeImage";
import { MessageKey } from "../../../../domain/i18n/messages";
import { Eyebrow } from "../../../Eyebrow";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./JoinInvitation.module.css";

export function JoinInvitation({
  joinUrl,
  pingKey,
}: {
  joinUrl: string;
  pingKey: number;
}) {
  const { translate } = useTranslation();
  const caption = translate(MessageKey.JoinScanToJoin);

  return (
    <div className={styles.invitation}>
      <div className={styles.card}>
        {pingKey > 0 && (
          <span
            key={pingKey}
            className={styles.ping}
            data-testid="join-ping"
            aria-hidden="true"
          />
        )}
        <QrCodeImage
          payload={joinUrl}
          title={caption}
          className={styles.qrCode}
        />
      </div>
      <Eyebrow>{caption}</Eyebrow>
    </div>
  );
}
