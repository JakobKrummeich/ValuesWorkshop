"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import type { ParticipantQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { QuizQuestion } from "../../../QuizQuestion";
import styles from "./ParticipantQuizScreen.module.css";
import { QuizAnswerConfirmation } from "./QuizAnswerConfirmation";
import { useParticipantQuizScreen } from "./useParticipantQuizScreen";

export function ParticipantQuizScreen({
  state,
}: {
  state: ParticipantQuizState;
}) {
  const { language, translate } = useTranslation();
  const {
    questionNumber,
    answers,
    ownAnswer,
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
      {ownAnswer === null ? (
        <div className={styles.answers}>
          {answers.map((answer, answerIndex) => (
            <button
              key={answerIndex}
              type="button"
              className={styles.answer}
              data-testid={`answer-button-${answerIndex}`}
              disabled={!isAnswerable}
              onClick={() => chooseAnswer(answerIndex)}
            >
              {localizedText(language, answer)}
            </button>
          ))}
        </div>
      ) : (
        <QuizAnswerConfirmation answer={ownAnswer} />
      )}
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
    </section>
  );
}
