"use client";

import { createContext, useCallback, useState, type ReactNode } from "react";
import { writeDocumentLanguage } from "../../adapters/documentLanguage";
import { writeLanguageCookie } from "../../adapters/languageCookie";
import type { Language } from "../../domain/i18n/language";

export interface LanguageSelection {
  language: Language;
  selectLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageSelection | null>(null);

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: ReactNode;
}) {
  const [language, setLanguage] = useState(initialLanguage);

  const selectLanguage = useCallback((chosen: Language) => {
    writeLanguageCookie(chosen);
    writeDocumentLanguage(chosen);
    setLanguage(chosen);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, selectLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
