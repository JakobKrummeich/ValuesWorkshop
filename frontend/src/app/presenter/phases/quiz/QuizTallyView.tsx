"use client";

import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import { QuizQuestion } from "../../../QuizQuestion";
import { QuizAnswerRow } from "./QuizAnswerRow";
import styles from "./QuizTallyView.module.css";
import type { PresenterQuizBar } from "./presenterQuizScreenModel";

export function QuizTallyView({
  questionNumber,
  questionCount,
  question,
  bars,
}: {
  questionNumber: number;
  questionCount: number;
  question: LocalizedText;
  bars: readonly PresenterQuizBar[];
}) {
  return (
    <section className={styles.view}>
      <QuizQuestion
        questionNumber={questionNumber}
        questionCount={questionCount}
        question={question}
      />
      <div className={styles.chart}>
        {bars.map((bar, answerIndex) => (
          <QuizAnswerRow
            key={answerIndex}
            answerIndex={answerIndex}
            bar={bar}
          />
        ))}
      </div>
    </section>
  );
}
