"use client";

import { useCallback, useState } from "react";
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

export interface QuizAnswerOption {
  index: number;
  letter: string;
  text: LocalizedText;
  isPicked: boolean;
}

export type ParticipantQuizScreenView =
  | {
      kind: QuizScreenKind.Answering;
      answers: QuizAnswerOption[];
      pickedLetter: string | null;
      canLockIn: boolean;
      isAnswerable: boolean;
    }
  | { kind: QuizScreenKind.OwnAnswer; ownAnswer: LocalizedText }
  | { kind: QuizScreenKind.Waiting };

export interface ParticipantQuizScreenModel {
  questionNumber: number;
  view: ParticipantQuizScreenView;
  pickAnswer: (answerIndex: number) => void;
  lockInAnswer: () => void;
  rejectionMessage: MessageKey | null;
}

interface Pick {
  questionIndex: number;
  answerIndex: number;
}

const firstLetterCode = "A".charCodeAt(0);

export function answerLetterOf(answerIndex: number): string {
  return String.fromCharCode(firstLetterCode + answerIndex);
}

export function useParticipantQuizScreen(
  quiz: ParticipantQuizView,
): ParticipantQuizScreenModel {
  const { quizPort } = useParticipantDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const [pick, setPick] = useState<Pick | null>(null);
  const questionIndex = quiz.questionIndex;
  const pickedAnswerIndex =
    pick !== null && pick.questionIndex === questionIndex
      ? pick.answerIndex
      : null;

  const pickAnswer = useCallback(
    (answerIndex: number) => setPick({ questionIndex, answerIndex }),
    [questionIndex],
  );

  const lockInAnswer = useCallback(() => {
    if (pickedAnswerIndex === null || isSending) {
      return;
    }
    sendIntent(quizPort.chooseAnswer(questionIndex, pickedAnswerIndex));
  }, [pickedAnswerIndex, isSending, sendIntent, quizPort, questionIndex]);

  return {
    questionNumber: questionIndex + 1,
    view: screenView(quiz, pickedAnswerIndex, isSending),
    pickAnswer,
    lockInAnswer,
    rejectionMessage,
  };
}

function screenView(
  quiz: ParticipantQuizView,
  pickedAnswerIndex: number | null,
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
    answers: quiz.answers.map((text, index) => ({
      index,
      letter: answerLetterOf(index),
      text,
      isPicked: index === pickedAnswerIndex,
    })),
    pickedLetter:
      pickedAnswerIndex === null ? null : answerLetterOf(pickedAnswerIndex),
    canLockIn: pickedAnswerIndex !== null && !isSending,
    isAnswerable: !isSending,
  };
}
