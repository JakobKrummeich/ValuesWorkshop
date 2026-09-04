"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantQuizState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { QuizQuestion } from "../../../QuizQuestion";
import { WaitingScreen } from "../../../WaitingScreen";
import { ActionBar } from "../../ActionBar";
import { CallToAction } from "../../CallToAction";
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
  const { questionNumber, view, pickAnswer, lockInAnswer, rejectionMessage } =
    useParticipantQuizScreen(state.quiz);

  if (view.kind === QuizScreenKind.Waiting) {
    return <WaitingScreen heading={MessageKey.WaitingEyesUpFront} />;
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
          {view.answers.map((answer) => (
            <button
              key={answer.index}
              type="button"
              className={`${styles.answer} ${
                answer.isPicked ? styles.picked : ""
              }`}
              data-testid={`answer-button-${answer.index}`}
              aria-pressed={answer.isPicked}
              disabled={!view.isAnswerable}
              onClick={() => pickAnswer(answer.index)}
            >
              <span className={styles.letter} aria-hidden="true">
                {answer.letter}
              </span>
              <span className={styles.answerText}>
                {localizedText(language, answer.text)}
              </span>
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
      {view.kind === QuizScreenKind.Answering && (
        <ActionBar>
          <CallToAction
            testId="lock-in-answer-button"
            disabled={!view.canLockIn}
            onClick={lockInAnswer}
          >
            {view.pickedLetter === null
              ? translate(MessageKey.QuizPickAnswer)
              : translate(MessageKey.QuizLockInAnswer, {
                  letter: view.pickedLetter,
                })}
          </CallToAction>
        </ActionBar>
      )}
    </section>
  );
}
