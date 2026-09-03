"use client";

import type { PresenterQuizState } from "../../../../domain/workshopState";
import { QuizLearningView } from "./QuizLearningView";
import { QuizTallyView } from "./QuizTallyView";
import { QuizWallView, usePresenterQuizScreen } from "./usePresenterQuizScreen";

export function PresenterQuizScreen({ state }: { state: PresenterQuizState }) {
  const model = usePresenterQuizScreen(state.quiz);

  if (model.view === QuizWallView.LearningText) {
    return (
      <QuizLearningView
        correctAnswer={model.correctAnswer}
        learningText={model.learningText}
      />
    );
  }

  return (
    <QuizTallyView
      questionNumber={model.questionNumber}
      questionCount={state.quiz.questionCount}
      question={state.quiz.question}
      bars={model.bars}
    />
  );
}
