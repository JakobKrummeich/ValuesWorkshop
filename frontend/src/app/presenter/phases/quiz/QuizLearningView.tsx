"use client";

import {
  localizedText,
  type LocalizedText,
} from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { Eyebrow } from "../../../Eyebrow";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./QuizLearningView.module.css";

export function QuizLearningView({
  correctAnswer,
  learningText,
}: {
  correctAnswer: LocalizedText;
  learningText: LocalizedText;
}) {
  const { language, translate } = useTranslation();

  return (
    <section className={styles.view} data-testid="learning-text">
      <Eyebrow className={styles.eyebrow}>
        {translate(MessageKey.QuizLearningTextHeading)}
      </Eyebrow>
      <p className={styles.correctAnswer} data-testid="learning-correct-answer">
        <svg
          className={styles.check}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
        {localizedText(language, correctAnswer)}
      </p>
      <p className={styles.text}>{localizedText(language, learningText)}</p>
    </section>
  );
}
