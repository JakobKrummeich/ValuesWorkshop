import type { Language } from "../domain/i18n/language";

export function writeDocumentLanguage(language: Language): void {
  document.documentElement.lang = language;
}
