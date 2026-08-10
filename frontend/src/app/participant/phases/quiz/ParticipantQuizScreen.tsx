"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import type { ParticipantQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { QuizLearningText } from "../../../QuizLearningText";
import { QuizQuestion } from "../../../QuizQuestion";
import styles from "./ParticipantQuizScreen.module.css";
import {
  AnswerStatus,
  useParticipantQuizScreen,
} from "./useParticipantQuizScreen";

const answerStatusClasses: Readonly<Record<AnswerStatus, string>> = {
  [AnswerStatus.Neutral]: styles.answer,
  [AnswerStatus.Own]: `${styles.answer} ${styles.own}`,
  [AnswerStatus.Correct]: `${styles.answer} ${styles.correct}`,
  [AnswerStatus.OwnIncorrect]: `${styles.answer} ${styles.ownIncorrect}`,
};

export function ParticipantQuizScreen({
  state,
}: {
  state: ParticipantQuizState;
}) {
  const { language, translate } = useTranslation();
  const {
    questionNumber,
    answers,
    isAnswerable,
    chooseAnswer,
    rejectionMessage,
  } = useParticipantQuizScreen(state.quiz);

  return (
    <section className={styles.quiz}>
      <QuizQuestion
        questionNumber={questionNumber}
        questionCount={state.quiz.questionCount}
        question={state.quiz.question}
      />
      <div className={styles.answers}>
        {answers.map((answer, answerIndex) => (
          <button
            key={answerIndex}
            type="button"
            className={answerStatusClasses[answer.status]}
            data-testid={`answer-button-${answerIndex}`}
            data-answer-status={answer.status}
            disabled={!isAnswerable}
            onClick={() => chooseAnswer(answerIndex)}
          >
            {localizedText(language, answer.text)}
          </button>
        ))}
      </div>
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
      {state.quiz.learningText !== undefined && (
        <QuizLearningText learningText={state.quiz.learningText} />
      )}
    </section>
  );
}
