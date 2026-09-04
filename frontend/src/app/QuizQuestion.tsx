"use client";

import {
  localizedText,
  type LocalizedText,
} from "../domain/i18n/localizedText";
import { MessageKey } from "../domain/i18n/messages";
import { Eyebrow } from "./Eyebrow";
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
      <Eyebrow testId="question-heading">
        {translate(MessageKey.QuizQuestionHeading, {
          n: questionNumber,
          total: questionCount,
        })}
      </Eyebrow>
      <p className={styles.question} data-testid="question-text">
        {localizedText(language, question)}
      </p>
    </header>
  );
}
