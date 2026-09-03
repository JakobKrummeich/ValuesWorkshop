"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type {
  GroupName,
  GroupWorkStatus,
} from "../../../../domain/workshopState";
import { AnimalGlyph } from "../../../AnimalGlyph";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./GroupWorkHeader.module.css";
import { WorkStatusBadge } from "./WorkStatusBadge";

export function GroupWorkHeader({
  groupName,
  memberDisplayNames,
  scribeName,
  isCallerScribe,
  workStatus,
}: {
  groupName: GroupName;
  memberDisplayNames: string[];
  scribeName: string | null;
  isCallerScribe: boolean;
  workStatus: GroupWorkStatus | undefined;
}) {
  const { language, translate } = useTranslation();

  return (
    <header className={styles.header}>
      <span className={styles.watermark}>
        <AnimalGlyph animalId={groupName.animalId} />
      </span>
      <div className={styles.titleRow}>
        <h2 className={styles.name} data-testid="group-work-name">
          <span className={styles.glyph}>
            <AnimalGlyph animalId={groupName.animalId} />
          </span>
          <span>{localizedText(language, groupName.text)}</span>
        </h2>
        {workStatus !== undefined && (
          <WorkStatusBadge workStatus={workStatus} />
        )}
      </div>
      <ul className={styles.members}>
        {memberDisplayNames.map((displayName, index) => (
          <li
            key={index}
            className={styles.member}
            data-testid="group-work-member"
          >
            {displayName}
          </li>
        ))}
      </ul>
      {scribeName !== null && (
        <p className={styles.scribe} data-testid="group-work-scribe">
          {translate(
            isCallerScribe
              ? MessageKey.GroupWorkScribeIsYou
              : MessageKey.GroupWorkScribeLabel,
            { name: scribeName },
          )}
        </p>
      )}
    </header>
  );
}
