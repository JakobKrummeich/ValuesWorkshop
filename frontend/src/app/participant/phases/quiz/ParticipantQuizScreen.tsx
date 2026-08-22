"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import type { ParticipantQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { QuizQuestion } from "../../../QuizQuestion";
import { WaitingScreen } from "../../../WaitingScreen";
import styles from "./ParticipantQuizScreen.module.css";
import { QuizAnswerConfirmation } from "./QuizAnswerConfirmation";
import {
  QuizScreenKind,
  useParticipantQuizScreen,
} from "./useParticipantQuizScreen";

export function ParticipantQuizScreen({
  state,
}: {
  state: ParticipantQuizState;
}) {
  const { language, translate } = useTranslation();
  const { questionNumber, view, chooseAnswer, rejectionMessage } =
    useParticipantQuizScreen(state.quiz);

  if (view.kind === QuizScreenKind.Waiting) {
    return <WaitingScreen />;
  }

  return (
    <section className={styles.quiz}>
      <QuizQuestion
        questionNumber={questionNumber}
        questionCount={state.quiz.questionCount}
        question={state.quiz.question}
      />
      {view.kind === QuizScreenKind.Answering ? (
        <div className={styles.answers}>
          {view.answers.map((answer, answerIndex) => (
            <button
              key={answerIndex}
              type="button"
              className={styles.answer}
              data-testid={`answer-button-${answerIndex}`}
              disabled={!view.isAnswerable}
              onClick={() => chooseAnswer(answerIndex)}
            >
              {localizedText(language, answer)}
            </button>
          ))}
        </div>
      ) : (
        <QuizAnswerConfirmation answer={view.ownAnswer} />
      )}
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
    </section>
  );
}
