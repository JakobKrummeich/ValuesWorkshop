import { ConnectionState } from "../../connectionState";
import { connectionStateMessage } from "../connectionStateMessage";
import { generalMessages } from "../generalMessages";
import { Language, defaultLanguage, readLanguage } from "../language";
import { MessageKey, messages } from "../messages";
import { finalPresentationMessages } from "../phases/finalPresentationMessages";
import { finalVotingMessages } from "../phases/finalVotingMessages";
import { groupFormationMessages } from "../phases/groupFormationMessages";
import { groupWorkMessages } from "../phases/groupWorkMessages";
import { joinMessages } from "../phases/joinMessages";
import { quizMessages } from "../phases/quizMessages";
import { selectionMessages } from "../phases/selectionMessages";
import { selectionResultsMessages } from "../phases/selectionResultsMessages";
import { valuePresentationMessages } from "../phases/valuePresentationMessages";
import { translate } from "../translate";

const catalogs = {
  general: generalMessages,
  join: joinMessages,
  quiz: quizMessages,
  selection: selectionMessages,
  selectionResults: selectionResultsMessages,
  groupFormation: groupFormationMessages,
  groupWork: groupWorkMessages,
  valuePresentation: valuePresentationMessages,
  finalVoting: finalVotingMessages,
  finalPresentation: finalPresentationMessages,
};

function parametersOf(message: string): string[] {
  return [...new Set(message.match(/\{\w+\}/g) ?? [])].sort();
}

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

  // WHY: `catalogs` mirrors the spread list in messages.ts by hand, and a
  // catalog missing from the mirror does not fail — it silently shrinks the
  // duplicate guard below. That is how groupWorkMessages, valuePresentation-
  // Messages and finalVotingMessages (34 of 105 keys) stayed unguarded after
  // the split in f066f48. Building `messages` from a loop instead would drop
  // the exhaustiveness check tsc gets from the literal spreads, so the mirror
  // stays and this assertion is what keeps it honest.
  it("sees every message catalog the app merges", () => {
    const catalogedKeys = new Set(
      Object.values(catalogs).flatMap((catalog) => Object.keys(catalog)),
    );

    const unguarded = Object.values(MessageKey).filter(
      (key) => !catalogedKeys.has(key),
    );

    expect(unguarded).toEqual([]);
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

  // WHY: `translate` substitutes by name — it replaces `{count}` wherever it
  // stands — so the two languages of one key are two independent placeholder
  // lists that nothing forces to agree. Drop `{count}` from the English text
  // and English silently loses the number; add `{cout}` and that language
  // renders the braces to the user. Neither shows up elsewhere: the Playwright
  // suite pins `locale: "en-US"` and so never reads the German half, while the
  // German half is what `defaultLanguage` serves to this workshop's audience.
  it("names the same parameters in both languages of a message", () => {
    const diverging = Object.values(MessageKey).filter(
      (key) =>
        parametersOf(messages[key][Language.German]).join(",") !==
        parametersOf(messages[key][Language.English]).join(","),
    );

    expect(diverging).toEqual([]);
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
