"use client";

import {
  localizedText,
  type LocalizedText,
} from "../domain/i18n/localizedText";
import { MessageKey } from "../domain/i18n/messages";
import { Eyebrow, EyebrowTone } from "./Eyebrow";
import { useTranslation } from "./i18n/useTranslation";
import styles from "./QuizLearningText.module.css";

export function QuizLearningText({
  learningText,
}: {
  learningText: LocalizedText;
}) {
  const { language, translate } = useTranslation();

  return (
    <aside className={styles.panel} data-testid="learning-text">
      <Eyebrow tone={EyebrowTone.Accent}>
        {translate(MessageKey.QuizLearningTextHeading)}
      </Eyebrow>
      <p className={styles.body}>{localizedText(language, learningText)}</p>
    </aside>
  );
}
