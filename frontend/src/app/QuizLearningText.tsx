"use client";

import {
  localizedText,
  type LocalizedText,
} from "../domain/i18n/localizedText";
import { MessageKey } from "../domain/i18n/messages";
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
      <h3 className={styles.heading}>
        {translate(MessageKey.QuizLearningTextHeading)}
      </h3>
      <p className={styles.body}>{localizedText(language, learningText)}</p>
    </aside>
  );
}
