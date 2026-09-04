"use client";

import {
  localizedText,
  type LocalizedText,
} from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { CheckMark } from "../../../CheckMark";
import { Eyebrow } from "../../../Eyebrow";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./QuizLearningView.module.css";

export function QuizLearningView({
  correctAnswer,
  learningText,
}: {
  correctAnswer: LocalizedText;
  learningText: LocalizedText;
}) {
  const { language, translate } = useTranslation();

  return (
    <section className={styles.view} data-testid="learning-text">
      <Eyebrow className={styles.eyebrow}>
        {translate(MessageKey.QuizLearningTextHeading)}
      </Eyebrow>
      <p className={styles.correctAnswer} data-testid="learning-correct-answer">
        <CheckMark />
        {localizedText(language, correctAnswer)}
      </p>
      <p className={styles.text}>{localizedText(language, learningText)}</p>
    </section>
  );
}
