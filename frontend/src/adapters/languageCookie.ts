import {
  Language,
  languageCookieName,
  readLanguage,
} from "../domain/i18n/language";

const oneYearInSeconds = 60 * 60 * 24 * 365;

export function readLanguageCookie(): Language | undefined {
  return readLanguage(
    document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${languageCookieName}=`))
      ?.slice(languageCookieName.length + 1),
  );
}

export function writeLanguageCookie(language: Language): void {
  document.cookie = `${languageCookieName}=${language}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
}
