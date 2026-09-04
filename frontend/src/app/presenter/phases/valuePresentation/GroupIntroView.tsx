"use client";

import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { AnimalGlyph } from "../../../AnimalGlyph";
import { Eyebrow } from "../../../Eyebrow";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./GroupIntroView.module.css";

export function GroupIntroView({
  animalId,
  groupName,
}: {
  animalId: string;
  groupName: LocalizedText;
}) {
  const { language, translate } = useTranslation();

  return (
    <section
      className={styles.intro}
      data-testid={`group-intro-${animalId}`}
      data-animal={animalId}
    >
      <div className={styles.glyph}>
        <AnimalGlyph animalId={animalId} />
      </div>
      <Eyebrow>{translate(MessageKey.ValuePresentationUpNext)}</Eyebrow>
      <h2 className={styles.groupName}>{localizedText(language, groupName)}</h2>
    </section>
  );
}
