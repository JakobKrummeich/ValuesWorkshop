"use client";

import {
  localizedText,
  type LocalizedText,
} from "../domain/i18n/localizedText";
import { MessageKey } from "../domain/i18n/messages";
import { useTranslation } from "./i18n/useTranslation";
import styles from "./QuizQuestion.module.css";

export function QuizQuestion({
  questionNumber,
  questionCount,
  question,
}: {
  questionNumber: number;
  questionCount: number;
  question: LocalizedText;
}) {
  const { language, translate } = useTranslation();

  return (
    <header className={styles.header}>
      <h2 className={styles.heading} data-testid="question-heading">
        {translate(MessageKey.QuizQuestionHeading, {
          n: questionNumber,
          total: questionCount,
        })}
      </h2>
      <p className={styles.question} data-testid="question-text">
        {localizedText(language, question)}
      </p>
    </header>
  );
}
