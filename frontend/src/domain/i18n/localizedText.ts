import type { Language } from "./language";

export type LocalizedText = Readonly<Record<Language, string>>;

export function localizedText(language: Language, text: LocalizedText): string {
  return text[language];
}
