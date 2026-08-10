"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { ParticipantQuizView } from "../../../../domain/workshopState";
import { QuizSubState } from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useParticipantDependencies } from "../../dependencies";

export enum AnswerStatus {
  Neutral = "neutral",
  Own = "own",
  Correct = "correct",
  OwnIncorrect = "ownIncorrect",
}

export interface ParticipantQuizAnswer {
  text: LocalizedText;
  status: AnswerStatus;
}

export interface ParticipantQuizScreenModel {
  questionNumber: number;
  answers: ParticipantQuizAnswer[];
  isAnswerable: boolean;
  chooseAnswer: (answerIndex: number) => void;
  rejectionMessage: MessageKey | null;
}

export function useParticipantQuizScreen(
  quiz: ParticipantQuizView,
): ParticipantQuizScreenModel {
  const { quiz: quizPort } = useParticipantDependencies();
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
    answers: quiz.answers.map((text, answerIndex) => ({
      text,
      status: answerStatus(quiz, answerIndex),
    })),
    isAnswerable:
      quiz.subState === QuizSubState.Answering &&
      quiz.ownAnswerIndex === null &&
      !isSending,
    chooseAnswer,
    rejectionMessage,
  };
}

function answerStatus(
  quiz: ParticipantQuizView,
  answerIndex: number,
): AnswerStatus {
  const isOwn = quiz.ownAnswerIndex === answerIndex;
  if (quiz.correctAnswerIndex === undefined) {
    return isOwn ? AnswerStatus.Own : AnswerStatus.Neutral;
  }
  if (quiz.correctAnswerIndex === answerIndex) {
    return AnswerStatus.Correct;
  }
  return isOwn ? AnswerStatus.OwnIncorrect : AnswerStatus.Neutral;
}
