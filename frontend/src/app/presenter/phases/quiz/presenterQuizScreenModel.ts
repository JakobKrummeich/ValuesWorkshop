import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { PresenterQuizView } from "../../../../domain/workshopState";

export enum QuizWallView {
  Tally = "tally",
  LearningText = "learningText",
}

export enum AnswerBarEmphasis {
  Live = "liveBar",
  Correct = "correctBar",
  Dimmed = "dimmedBar",
}

export interface PresenterQuizBar {
  text: LocalizedText;
  voteCount: number;
  widthFraction: number;
  emphasis: AnswerBarEmphasis;
}

export type PresenterQuizScreenModel =
  | {
      view: QuizWallView.Tally;
      questionNumber: number;
      bars: PresenterQuizBar[];
    }
  | {
      view: QuizWallView.LearningText;
      correctAnswer: LocalizedText;
      learningText: LocalizedText;
    };

function emphasisOf(
  answerIndex: number,
  correctAnswerIndex: number | undefined,
): AnswerBarEmphasis {
  if (correctAnswerIndex === undefined) {
    return AnswerBarEmphasis.Live;
  }
  return answerIndex === correctAnswerIndex
    ? AnswerBarEmphasis.Correct
    : AnswerBarEmphasis.Dimmed;
}

export function presenterQuizScreenModelOf(
  quiz: PresenterQuizView,
): PresenterQuizScreenModel {
  if (
    quiz.learningText !== undefined &&
    quiz.correctAnswerIndex !== undefined
  ) {
    return {
      view: QuizWallView.LearningText,
      correctAnswer: quiz.answers[quiz.correctAnswerIndex],
      learningText: quiz.learningText,
    };
  }

  const strongestTally = Math.max(...quiz.answerTallies, 0);

  return {
    view: QuizWallView.Tally,
    questionNumber: quiz.questionIndex + 1,
    bars: quiz.answers.map((text, answerIndex) => ({
      text,
      voteCount: quiz.answerTallies[answerIndex],
      widthFraction:
        strongestTally === 0
          ? 0
          : quiz.answerTallies[answerIndex] / strongestTally,
      emphasis: emphasisOf(answerIndex, quiz.correctAnswerIndex),
    })),
  };
}
