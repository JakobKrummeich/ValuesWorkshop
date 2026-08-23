"use client";

import { localizedText } from "../domain/i18n/localizedText";
import type { GroupName, WorkshopValue } from "../domain/workshopState";
import styles from "./GroupCard.module.css";
import { useTranslation } from "./i18n/useTranslation";

export function GroupCard({
  name,
  memberDisplayNames,
  assignedValues,
}: {
  name: GroupName;
  memberDisplayNames: string[];
  assignedValues: WorkshopValue[];
}) {
  const { language } = useTranslation();

  return (
    <article
      className={styles.card}
      data-testid={`group-card-${name.animalId}`}
    >
      <div className={styles.identity}>
        <h2 className={styles.name} data-testid="group-name">
          {localizedText(language, name.text)}
        </h2>
        <ul className={styles.members}>
          {memberDisplayNames.map((displayName, index) => (
            <li
              key={index}
              className={styles.member}
              data-testid="group-member"
            >
              {displayName}
            </li>
          ))}
        </ul>
      </div>
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
