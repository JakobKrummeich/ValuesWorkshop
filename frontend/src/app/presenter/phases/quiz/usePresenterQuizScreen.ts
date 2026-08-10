"use client";

import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { PresenterQuizView } from "../../../../domain/workshopState";

export interface PresenterQuizBar {
  text: LocalizedText;
  voteCount: number;
  widthFraction: number;
  isCorrect: boolean;
}

export interface PresenterQuizScreenModel {
  questionNumber: number;
  isRevealed: boolean;
  bars: PresenterQuizBar[];
}

export function usePresenterQuizScreen(
  quiz: PresenterQuizView,
): PresenterQuizScreenModel {
  const strongestTally = Math.max(...quiz.answerTallies, 0);

  return {
    questionNumber: quiz.questionIndex + 1,
    isRevealed: quiz.correctAnswerIndex !== undefined,
    bars: quiz.answers.map((text, answerIndex) => ({
      text,
      voteCount: quiz.answerTallies[answerIndex],
      widthFraction:
        strongestTally === 0
          ? 0
          : quiz.answerTallies[answerIndex] / strongestTally,
      isCorrect: quiz.correctAnswerIndex === answerIndex,
    })),
  };
}
