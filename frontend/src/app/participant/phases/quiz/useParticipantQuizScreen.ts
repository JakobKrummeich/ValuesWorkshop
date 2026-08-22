"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { ParticipantQuizView } from "../../../../domain/workshopState";
import { QuizSubState } from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useParticipantDependencies } from "../../dependencies";

export enum QuizScreenKind {
  Answering = "answering",
  OwnAnswer = "ownAnswer",
  Waiting = "waiting",
}

export type ParticipantQuizScreenView =
  | {
      kind: QuizScreenKind.Answering;
      answers: LocalizedText[];
      isAnswerable: boolean;
    }
  | { kind: QuizScreenKind.OwnAnswer; ownAnswer: LocalizedText }
  | { kind: QuizScreenKind.Waiting };

export interface ParticipantQuizScreenModel {
  questionNumber: number;
  view: ParticipantQuizScreenView;
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
    view: screenView(quiz, isSending),
    chooseAnswer,
    rejectionMessage,
  };
}

function screenView(
  quiz: ParticipantQuizView,
  isSending: boolean,
): ParticipantQuizScreenView {
  if (quiz.ownAnswerIndex !== null) {
    return {
      kind: QuizScreenKind.OwnAnswer,
      ownAnswer: quiz.answers[quiz.ownAnswerIndex],
    };
  }
  if (quiz.subState !== QuizSubState.Answering) {
    return { kind: QuizScreenKind.Waiting };
  }
  return {
    kind: QuizScreenKind.Answering,
    answers: quiz.answers,
    isAnswerable: !isSending,
  };
}
