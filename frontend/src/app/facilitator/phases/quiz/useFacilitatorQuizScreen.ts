"use client";

import { useCallback } from "react";
import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../domain/intentResult";
import type { FacilitatorQuizControlPort } from "../../../../domain/ports/facilitator/quizControlPort";
import type { FacilitatorQuizState } from "../../../../domain/workshopState";
import {
  FacilitatorIntent,
  QuizSubState,
} from "../../../../domain/workshopState";
import type { Single } from "../../../../shared/reactiveTypes";
import { answerLetterOf } from "../../../answerLetter";
import { useIntentSender } from "../../../useIntentSender";
import { useFacilitatorDependencies } from "../../dependencies";

interface QuizControlAction {
  intent: FacilitatorIntent;
  label: MessageKey;
  invoke: (port: FacilitatorQuizControlPort) => Single<IntentResult>;
}

const quizControlActions: readonly QuizControlAction[] = [
  {
    intent: FacilitatorIntent.RevealAnswer,
    label: MessageKey.QuizRevealAnswer,
    invoke: (port) => port.revealAnswer(),
  },
  {
    intent: FacilitatorIntent.ShowLearningText,
    label: MessageKey.QuizShowLearningText,
    invoke: (port) => port.showLearningText(),
  },
  {
    intent: FacilitatorIntent.PoseNextQuestion,
    label: MessageKey.QuizNextQuestion,
    invoke: (port) => port.poseNextQuestion(),
  },
];

export interface QuizControl {
  label: MessageKey;
  send: () => void;
}

export interface FacilitatorQuizAnswer {
  letter: string;
  text: LocalizedText;
  voteCount: number;
  widthFraction: number;
  isCorrect: boolean;
}

export interface FacilitatorQuizScreenModel {
  questionNumber: number;
  answers: FacilitatorQuizAnswer[];
  isRevealed: boolean;
  quizControl: QuizControl | null;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
}

export function useFacilitatorQuizScreen(
  state: FacilitatorQuizState,
): FacilitatorQuizScreenModel {
  const { quizControlPort } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const quiz = state.quiz;

  const enabledAction =
    quizControlActions.find((action) =>
      state.enabledIntents.includes(action.intent),
    ) ?? null;
  const invokeEnabledAction = enabledAction?.invoke ?? null;

  const send = useCallback(() => {
    if (invokeEnabledAction !== null) {
      sendIntent(invokeEnabledAction(quizControlPort));
    }
  }, [invokeEnabledAction, quizControlPort, sendIntent]);

  const strongestTally = Math.max(...quiz.answerTallies, 0);

  return {
    questionNumber: quiz.questionIndex + 1,
    answers: quiz.answers.map((text, answerIndex) => ({
      letter: answerLetterOf(answerIndex),
      text,
      voteCount: quiz.answerTallies[answerIndex],
      widthFraction:
        strongestTally === 0
          ? 0
          : quiz.answerTallies[answerIndex] / strongestTally,
      isCorrect: answerIndex === quiz.correctAnswerIndex,
    })),
    isRevealed: quiz.subState !== QuizSubState.Answering,
    quizControl:
      enabledAction === null ? null : { label: enabledAction.label, send },
    isSending,
    rejectionMessage,
  };
}
