"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./FacilitatorQuizScreen.module.css";
import { useFacilitatorQuizScreen } from "./useFacilitatorQuizScreen";

export function FacilitatorQuizScreen({
  state,
}: {
  state: FacilitatorQuizState;
}) {
  const { language, translate } = useTranslation();
  const { questionNumber, quizControl, isSending, rejectionMessage } =
    useFacilitatorQuizScreen(state);
  const quiz = state.quiz;

  return (
    <section className={styles.quiz}>
      <h2 className={styles.heading} data-testid="question-heading">
        {translate(MessageKey.QuizQuestionHeading, {
          n: questionNumber,
          total: quiz.questionCount,
        })}
      </h2>
      <p className={styles.question} data-testid="question-text">
        {localizedText(language, quiz.question)}
      </p>
      <p className={styles.answeredCount} data-testid="answered-count">
        {translate(MessageKey.QuizAnsweredCount, {
          answered: quiz.answeredCount,
          total: state.roster.participantCount,
        })}
      </p>
      <ul className={styles.answers}>
        {quiz.answers.map((answer, answerIndex) => (
          <li
            key={answerIndex}
            className={
              answerIndex === quiz.correctAnswerIndex
                ? `${styles.answer} ${styles.correct}`
                : styles.answer
            }
            data-testid={`answer-row-${answerIndex}`}
            data-correct={answerIndex === quiz.correctAnswerIndex}
          >
            <span className={styles.answerText}>
              {localizedText(language, answer)}
            </span>
            {answerIndex === quiz.correctAnswerIndex && (
              <span className={styles.correctMarker}>
                {translate(MessageKey.QuizCorrectAnswer)}
              </span>
            )}
            <span
              className={styles.tally}
              data-testid={`answer-tally-${answerIndex}`}
            >
              {translate(MessageKey.QuizVoteCount, {
                count: quiz.answerTallies[answerIndex],
              })}
            </span>
          </li>
        ))}
      </ul>
      <aside className={styles.learningText} data-testid="learning-text">
        <h3 className={styles.learningTextHeading}>
          {translate(MessageKey.QuizLearningTextHeading)}
        </h3>
        <p className={styles.learningTextBody}>
          {localizedText(language, quiz.learningText)}
        </p>
      </aside>
      {quizControl !== null && (
        <button
          type="button"
          className={styles.controlButton}
          data-testid="quiz-control-button"
          disabled={isSending}
          onClick={quizControl.send}
        >
          {translate(quizControl.label)}
        </button>
      )}
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
    </section>
  );
}
