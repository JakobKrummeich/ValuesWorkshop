import type { ReactNode } from "react";
import { Language } from "../domain/i18n/language";
import { LanguageProvider } from "../app/i18n/LanguageProvider";

export function languageWrapper(language: Language = Language.English) {
  return function LanguageWrapper({ children }: { children: ReactNode }) {
    return (
      <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
    );
  };
}
