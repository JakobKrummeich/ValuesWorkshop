import { z } from "zod";

export enum Language {
  German = "de",
  English = "en",
}

export const defaultLanguage = Language.German;

export const languageCookieName = "language";

const languageSchema = z.enum(Language);

export function readLanguage(candidate: unknown): Language | undefined {
  const parsed = languageSchema.safeParse(candidate);

  return parsed.success ? parsed.data : undefined;
}
