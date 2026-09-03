import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const quizMessages = {
  [MessageKey.QuizQuestionHeading]: {
    [Language.German]: "Frage {n} von {total}",
    [Language.English]: "Question {n} of {total}",
  },
  [MessageKey.QuizOwnAnswerLabel]: {
    [Language.German]: "Deine Antwort:",
    [Language.English]: "Your answer:",
  },
  [MessageKey.QuizPickAnswer]: {
    [Language.German]: "Wähle eine Antwort",
    [Language.English]: "Pick an answer",
  },
  [MessageKey.QuizLockInAnswer]: {
    [Language.German]: "Antwort {letter} festlegen",
    [Language.English]: "Lock in answer {letter}",
  },
  [MessageKey.QuizAnsweredCount]: {
    [Language.German]: "{answered} von {total} haben geantwortet",
    [Language.English]: "{answered} of {total} have answered",
  },
  [MessageKey.QuizVoteCount]: {
    [Language.German]: "Stimmen: {count}",
    [Language.English]: "Votes: {count}",
  },
  [MessageKey.QuizCorrectAnswer]: {
    [Language.German]: "Richtige Antwort",
    [Language.English]: "Correct answer",
  },
  [MessageKey.QuizLearningTextHeading]: {
    [Language.German]: "Lerntext",
    [Language.English]: "Learning text",
  },
  [MessageKey.QuizRevealAnswer]: {
    [Language.German]: "Antwort aufdecken",
    [Language.English]: "Reveal answer",
  },
  [MessageKey.QuizShowLearningText]: {
    [Language.German]: "Lerntext zeigen",
    [Language.English]: "Show learning text",
  },
  [MessageKey.QuizNextQuestion]: {
    [Language.German]: "Nächste Frage",
    [Language.English]: "Next question",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
