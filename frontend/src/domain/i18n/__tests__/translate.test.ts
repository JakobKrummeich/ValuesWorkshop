import { ConnectionState } from "../../connectionState";
import { connectionStateMessage } from "../connectionStateMessage";
import { generalMessages } from "../generalMessages";
import { Language, defaultLanguage, readLanguage } from "../language";
import { MessageKey, messages } from "../messages";
import { groupFormationMessages } from "../phases/groupFormationMessages";
import { joinMessages } from "../phases/joinMessages";
import { quizMessages } from "../phases/quizMessages";
import { selectionMessages } from "../phases/selectionMessages";
import { selectionResultsMessages } from "../phases/selectionResultsMessages";
import { translate } from "../translate";

const catalogs = {
  general: generalMessages,
  join: joinMessages,
  quiz: quizMessages,
  selection: selectionMessages,
  selectionResults: selectionResultsMessages,
  groupFormation: groupFormationMessages,
};

describe("translation", () => {
  it("renders a message in the requested language", () => {
    expect(translate(Language.English, MessageKey.ConnectionConnected)).toBe(
      "Connected",
    );
    expect(translate(Language.German, MessageKey.ConnectionConnected)).toBe(
      "Verbunden",
    );
  });

  it("substitutes named parameters", () => {
    expect(
      translate(Language.German, MessageKey.SessionPhase, { phase: 3 }),
    ).toBe("Phase 3");
  });

  it("leaves placeholders alone when no parameter is supplied", () => {
    expect(translate(Language.English, MessageKey.SessionPhase)).toBe(
      "Phase {phase}",
    );
  });

  it("carries every message in both languages", () => {
    const untranslated = Object.values(MessageKey).filter((key) =>
      Object.values(Language).some(
        (language) => messages[key][language].trim() === "",
      ),
    );

    expect(untranslated).toEqual([]);
  });

  it("defines every message in exactly one catalog", () => {
    const catalogsByKey = new Map<string, string[]>();
    Object.entries(catalogs).forEach(([catalogName, catalog]) =>
      Object.keys(catalog).forEach((key) =>
        catalogsByKey.set(key, [
          ...(catalogsByKey.get(key) ?? []),
          catalogName,
        ]),
      ),
    );

    const claimedTwice = [...catalogsByKey].filter(
      ([, catalogNames]) => catalogNames.length > 1,
    );

    expect(claimedTwice).toEqual([]);
  });

  it("names a message for every connection state", () => {
    Object.values(ConnectionState).forEach((state) => {
      expect(Object.values(MessageKey)).toContain(
        connectionStateMessage(state),
      );
    });
  });
});

describe("language selection", () => {
  it("accepts the supported language tags", () => {
    expect(readLanguage("de")).toBe(Language.German);
    expect(readLanguage("en")).toBe(Language.English);
  });

  it("rejects anything else", () => {
    expect(readLanguage("fr")).toBeUndefined();
    expect(readLanguage(undefined)).toBeUndefined();
  });

  it("falls back to German", () => {
    expect(defaultLanguage).toBe(Language.German);
  });
});
