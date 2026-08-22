"use client";

import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { focusOnMount } from "../../../focusOnMount";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./QuizAnswerConfirmation.module.css";

export function QuizAnswerConfirmation({ answer }: { answer: LocalizedText }) {
  const { language, translate } = useTranslation();

  return (
    <div
      className={styles.confirmation}
      role="status"
      data-testid="own-answer-confirmation"
      tabIndex={-1}
      ref={focusOnMount}
    >
      <p className={styles.label}>{translate(MessageKey.QuizOwnAnswerLabel)}</p>
      <p className={styles.answer} data-testid="own-answer-text">
        {localizedText(language, answer)}
      </p>
    </div>
  );
}
