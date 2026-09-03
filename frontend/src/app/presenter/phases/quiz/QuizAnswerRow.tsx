"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { cssCustomProperty } from "../../../../shared/cssCustomProperty";
import { useTranslation } from "../../../i18n/useTranslation";
import { useCountUp } from "../../../useCountUp";
import styles from "./QuizAnswerRow.module.css";
import {
  AnswerBarEmphasis,
  type PresenterQuizBar,
} from "./usePresenterQuizScreen";

export function QuizAnswerRow({
  answerIndex,
  bar,
}: {
  answerIndex: number;
  bar: PresenterQuizBar;
}) {
  const { language } = useTranslation();
  const displayedVotes = useCountUp(bar.voteCount);
  const isCorrect = bar.emphasis === AnswerBarEmphasis.Correct;

  return (
    <div
      className={isCorrect ? `${styles.row} ${styles.correctRow}` : styles.row}
      data-testid={`answer-row-${answerIndex}`}
      data-correct={isCorrect}
    >
      <span className={styles.answerText}>
        {localizedText(language, bar.text)}
        {isCorrect && (
          <svg
            className={styles.check}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
        )}
      </span>
      <div className={styles.track}>
        <div
          className={`${styles.bar} ${styles[bar.emphasis]}`}
          data-testid={`answer-bar-${answerIndex}`}
          style={cssCustomProperty("--vote-fraction", bar.widthFraction)}
        />
      </div>
      <span
        className={styles.voteCount}
        data-testid={`answer-votes-${answerIndex}`}
      >
        {displayedVotes}
      </span>
    </div>
  );
}
