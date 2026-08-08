import type { Language } from "./language";
import { MessageKey, messages } from "./messages";

export type MessageParameters = Readonly<Record<string, string | number>>;

export function translate(
  language: Language,
  key: MessageKey,
  parameters: MessageParameters = {},
): string {
  return Object.entries(parameters).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    messages[key][language],
  );
}
