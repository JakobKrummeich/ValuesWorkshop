"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { QuizLearningText } from "../../../QuizLearningText";
import { QuizQuestion } from "../../../QuizQuestion";
import { ControlButton } from "../../ControlButton";
import { IntentRejection } from "../../IntentRejection";
import { FacilitatorQuizAnswerRow } from "./FacilitatorQuizAnswerRow";
import styles from "./FacilitatorQuizScreen.module.css";
import { useFacilitatorQuizScreen } from "./useFacilitatorQuizScreen";

export function FacilitatorQuizScreen({
  state,
}: {
  state: FacilitatorQuizState;
}) {
  const { translate } = useTranslation();
  const {
    questionNumber,
    answers,
    isRevealed,
    quizControl,
    isSending,
    rejectionMessage,
  } = useFacilitatorQuizScreen(state);
  const quiz = state.quiz;

  return (
    <section className={styles.quiz}>
      <QuizQuestion
        questionNumber={questionNumber}
        questionCount={quiz.questionCount}
        question={quiz.question}
      />
      <ul className={styles.answers}>
        {answers.map((answer, answerIndex) => (
          <FacilitatorQuizAnswerRow
            key={answerIndex}
            answerIndex={answerIndex}
            answer={answer}
            isRevealed={isRevealed}
          />
        ))}
      </ul>
      <p className={styles.answeredCount} data-testid="answered-count">
        {translate(MessageKey.QuizAnsweredCount, {
          answered: quiz.answeredCount,
          total: state.roster.participantCount,
        })}
      </p>
      <QuizLearningText learningText={quiz.learningText} />
      <div className={styles.controls}>
        {quizControl !== null && (
          <ControlButton
            testId="quiz-control-button"
            isDisabled={isSending}
            onClick={quizControl.send}
          >
            {translate(quizControl.label)}
          </ControlButton>
        )}
        <IntentRejection message={rejectionMessage} />
      </div>
    </section>
  );
}
