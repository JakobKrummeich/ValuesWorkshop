"use client";

import { Language } from "../../domain/i18n/language";
import { MessageKey } from "../../domain/i18n/messages";
import { useTranslation } from "./useTranslation";

export interface LanguageChoice {
  language: Language;
  label: string;
  isSelected: boolean;
}

export interface LanguageSwitcherResult {
  label: string;
  choices: LanguageChoice[];
  selectLanguage: (language: Language) => void;
}

const choiceLabels: Readonly<Record<Language, MessageKey>> = {
  [Language.German]: MessageKey.LanguageGerman,
  [Language.English]: MessageKey.LanguageEnglish,
};

export function useLanguageSwitcher(): LanguageSwitcherResult {
  const { language, translate, selectLanguage } = useTranslation();

  return {
    label: translate(MessageKey.LanguageSwitcherLabel),
    choices: Object.values(Language).map((choice) => ({
      language: choice,
      label: translate(choiceLabels[choice]),
      isSelected: choice === language,
    })),
    selectLanguage,
  };
}
