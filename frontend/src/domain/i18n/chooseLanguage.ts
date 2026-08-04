import { Language, defaultLanguage, readLanguage } from "./language";

function acceptedLanguage(acceptLanguageHeader: string): Language | undefined {
  return acceptLanguageHeader
    .split(",")
    .map((entry) => readLanguage(entry.trim().split(";")[0].slice(0, 2)))
    .find((language) => language !== undefined);
}

export function chooseLanguage(
  cookieValue: string | undefined,
  acceptLanguageHeader: string | undefined,
): Language {
  return (
    readLanguage(cookieValue) ??
    acceptedLanguage(acceptLanguageHeader ?? "") ??
    defaultLanguage
  );
}
