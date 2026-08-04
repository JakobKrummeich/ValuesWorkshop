"use client";

import { useCallback, useContext } from "react";
import type { Language } from "../../domain/i18n/language";
import type { MessageKey } from "../../domain/i18n/messages";
import { translate, type MessageParameters } from "../../domain/i18n/translate";
import { LanguageContext } from "./LanguageProvider";

export interface Translation {
  language: Language;
  translate: (key: MessageKey, parameters?: MessageParameters) => string;
  selectLanguage: (language: Language) => void;
}

export function useTranslation(): Translation {
  const selection = useContext(LanguageContext);
  if (selection === null) {
    throw new Error("useTranslation requires LanguageProvider");
  }

  const language = selection.language;
  const translateMessage = useCallback(
    (key: MessageKey, parameters?: MessageParameters) =>
      translate(language, key, parameters),
    [language],
  );

  return {
    language,
    translate: translateMessage,
    selectLanguage: selection.selectLanguage,
  };
}
