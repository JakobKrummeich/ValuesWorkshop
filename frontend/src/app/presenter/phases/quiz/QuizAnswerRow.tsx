"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { cssCustomProperty } from "../../../../shared/cssCustomProperty";
import { CheckMark } from "../../../CheckMark";
import { useTranslation } from "../../../i18n/useTranslation";
import { useCountUp } from "../../../useCountUp";
import styles from "./QuizAnswerRow.module.css";
import {
  AnswerBarEmphasis,
  type PresenterQuizBar,
} from "./presenterQuizScreenModel";

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
        {isCorrect && <CheckMark className={styles.check} />}
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
