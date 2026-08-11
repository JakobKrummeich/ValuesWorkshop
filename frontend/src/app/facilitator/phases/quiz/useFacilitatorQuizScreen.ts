"use client";

import { useCallback } from "react";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../domain/intentResult";
import type { FacilitatorQuizControlPort } from "../../../../domain/ports/facilitator/quizControlPort";
import type { FacilitatorQuizState } from "../../../../domain/workshopState";
import { FacilitatorIntent } from "../../../../domain/workshopState";
import type { Single } from "../../../../shared/reactiveTypes";
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

export interface FacilitatorQuizScreenModel {
  questionNumber: number;
  quizControl: QuizControl | null;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
}

export function useFacilitatorQuizScreen(
  state: FacilitatorQuizState,
): FacilitatorQuizScreenModel {
  const { quizControlPort } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

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

  return {
    questionNumber: state.quiz.questionIndex + 1,
    quizControl:
      enabledAction === null ? null : { label: enabledAction.label, send },
    isSending,
    rejectionMessage,
  };
}
