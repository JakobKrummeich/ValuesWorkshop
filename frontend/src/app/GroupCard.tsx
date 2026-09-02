"use client";

import type { ReactNode } from "react";
import { localizedText } from "../domain/i18n/localizedText";
import type { GroupName, WorkshopValue } from "../domain/workshopState";
import { cssCustomProperty } from "../shared/cssCustomProperty";
import { AnimalGlyph } from "./AnimalGlyph";
import styles from "./GroupCard.module.css";
import { useTranslation } from "./i18n/useTranslation";

export enum GroupCardVariant {
  Wall = "wall",
  Paper = "paper",
  Phone = "phone",
}

export function GroupCard({
  name,
  memberDisplayNames,
  assignedValues,
  variant,
  status,
  index,
}: {
  name: GroupName;
  memberDisplayNames: string[];
  assignedValues: WorkshopValue[];
  variant: GroupCardVariant;
  status?: ReactNode;
  index?: number;
}) {
  const { language } = useTranslation();

  return (
    <article
      className={`${styles.card} ${styles[variant]}`}
      data-testid={`group-card-${name.animalId}`}
      data-animal={name.animalId}
      style={
        index === undefined ? undefined : cssCustomProperty("--index", index)
      }
    >
      <span className={styles.watermark}>
        <AnimalGlyph animalId={name.animalId} />
      </span>
      <h2 className={styles.name} data-testid="group-name">
        <span className={styles.badge}>
          <AnimalGlyph animalId={name.animalId} />
        </span>
        <span>{localizedText(language, name.text)}</span>
      </h2>
      <ul className={styles.members}>
        {memberDisplayNames.map((displayName, memberIndex) => (
          <li
            key={memberIndex}
            className={styles.member}
            data-testid="group-member"
          >
            {displayName}
          </li>
        ))}
      </ul>
      {status !== undefined && <div className={styles.status}>{status}</div>}
      <ul className={styles.values}>
        {assignedValues.map((value) => (
          <li
            key={value.valueId}
            className={styles.value}
            data-testid={`group-value-${value.valueId}`}
          >
            {localizedText(language, value.text)}
          </li>
        ))}
      </ul>
    </article>
  );
}
