"use client";

import type { CSSProperties } from "react";
import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresenterQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresenterQuizScreen.module.css";
import { usePresenterQuizScreen } from "./usePresenterQuizScreen";

function voteFraction(widthFraction: number): CSSProperties {
  return { "--vote-fraction": widthFraction } as CSSProperties;
}

function barClass(isRevealed: boolean, isCorrect: boolean): string {
  if (!isRevealed) {
    return styles.bar;
  }
  return isCorrect
    ? `${styles.bar} ${styles.correctBar}`
    : `${styles.bar} ${styles.dimmedBar}`;
}

export function PresenterQuizScreen({ state }: { state: PresenterQuizState }) {
  const { language, translate } = useTranslation();
  const { questionNumber, isRevealed, bars } = usePresenterQuizScreen(
    state.quiz,
  );

  return (
    <section className={styles.quiz}>
      <h2 className={styles.heading} data-testid="question-heading">
        {translate(MessageKey.QuizQuestionHeading, {
          n: questionNumber,
          total: state.quiz.questionCount,
        })}
      </h2>
      <p className={styles.question} data-testid="question-text">
        {localizedText(language, state.quiz.question)}
      </p>
      <div className={styles.chart}>
        {bars.map((bar, answerIndex) => (
          <div
            key={answerIndex}
            className={styles.row}
            data-testid={`answer-row-${answerIndex}`}
            data-correct={bar.isCorrect}
          >
            <span
              className={
                bar.isCorrect
                  ? `${styles.answerText} ${styles.correctAnswerText}`
                  : styles.answerText
              }
            >
              {localizedText(language, bar.text)}
            </span>
            <div className={styles.track}>
              <div
                className={barClass(isRevealed, bar.isCorrect)}
                data-testid={`answer-bar-${answerIndex}`}
                style={voteFraction(bar.widthFraction)}
              />
            </div>
            <span
              className={styles.voteCount}
              data-testid={`answer-votes-${answerIndex}`}
            >
              {bar.voteCount}
            </span>
          </div>
        ))}
      </div>
      {state.quiz.learningText !== undefined && (
        <aside className={styles.learningText} data-testid="learning-text">
          <h3 className={styles.learningTextHeading}>
            {translate(MessageKey.QuizLearningTextHeading)}
          </h3>
          <p className={styles.learningTextBody}>
            {localizedText(language, state.quiz.learningText)}
          </p>
        </aside>
      )}
    </section>
  );
}
