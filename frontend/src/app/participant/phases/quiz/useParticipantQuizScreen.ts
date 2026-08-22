"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { ParticipantQuizView } from "../../../../domain/workshopState";
import { QuizSubState } from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useParticipantDependencies } from "../../dependencies";

export interface ParticipantQuizScreenModel {
  questionNumber: number;
  answers: LocalizedText[];
  ownAnswer: LocalizedText | null;
  isAnswerable: boolean;
  chooseAnswer: (answerIndex: number) => void;
  rejectionMessage: MessageKey | null;
}

export function useParticipantQuizScreen(
  quiz: ParticipantQuizView,
): ParticipantQuizScreenModel {
  const { quizPort } = useParticipantDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const questionIndex = quiz.questionIndex;

  const chooseAnswer = useCallback(
    (answerIndex: number) => {
      sendIntent(quizPort.chooseAnswer(questionIndex, answerIndex));
    },
    [quizPort, questionIndex, sendIntent],
  );

  return {
    questionNumber: questionIndex + 1,
    answers: quiz.answers,
    ownAnswer:
      quiz.ownAnswerIndex === null ? null : quiz.answers[quiz.ownAnswerIndex],
    isAnswerable:
      quiz.subState === QuizSubState.Answering &&
      quiz.ownAnswerIndex === null &&
      !isSending,
    chooseAnswer,
    rejectionMessage,
  };
}
