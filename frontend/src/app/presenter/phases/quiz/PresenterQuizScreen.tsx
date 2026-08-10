"use client";

import type { CSSProperties } from "react";
import { localizedText } from "../../../../domain/i18n/localizedText";
import type { PresenterQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { QuizLearningText } from "../../../QuizLearningText";
import { QuizQuestion } from "../../../QuizQuestion";
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
  const { language } = useTranslation();
  const { questionNumber, isRevealed, bars } = usePresenterQuizScreen(
    state.quiz,
  );

  return (
    <section className={styles.quiz}>
      <QuizQuestion
        questionNumber={questionNumber}
        questionCount={state.quiz.questionCount}
        question={state.quiz.question}
      />
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
        <QuizLearningText learningText={state.quiz.learningText} />
      )}
    </section>
  );
}
