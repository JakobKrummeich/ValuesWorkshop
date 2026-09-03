"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { cssCustomProperty } from "../../../../shared/cssCustomProperty";
import { CheckMark } from "../../../CheckMark";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./FacilitatorQuizAnswerRow.module.css";
import type { FacilitatorQuizAnswer } from "./useFacilitatorQuizScreen";

export function FacilitatorQuizAnswerRow({
  answerIndex,
  answer,
  isRevealed,
}: {
  answerIndex: number;
  answer: FacilitatorQuizAnswer;
  isRevealed: boolean;
}) {
  const { language, translate } = useTranslation();

  return (
    <li
      className={`${styles.row} ${answer.isCorrect ? styles.correct : ""} ${
        isRevealed ? styles.revealed : ""
      }`}
      data-testid={`answer-row-${answerIndex}`}
      data-correct={answer.isCorrect}
    >
      <span className={styles.letter} aria-hidden="true">
        {answer.letter}
      </span>
      <span className={styles.text}>
        {localizedText(language, answer.text)}
        {answer.isCorrect && (
          <span className={styles.correctMarker}>
            <CheckMark />
            {translate(MessageKey.QuizCorrectAnswer)}
          </span>
        )}
      </span>
      <span className={styles.track}>
        <span
          className={styles.bar}
          style={cssCustomProperty("--vote-fraction", answer.widthFraction)}
        />
      </span>
      <span
        className={styles.tally}
        data-testid={`answer-tally-${answerIndex}`}
      >
        {translate(MessageKey.QuizVoteCount, { count: answer.voteCount })}
      </span>
    </li>
  );
}
