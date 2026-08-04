import { Language } from "../../domain/i18n/language";
import { readLanguageCookie, writeLanguageCookie } from "../languageCookie";

describe("the language cookie", () => {
  beforeEach(() => {
    document.cookie = "language=; path=/; max-age=0";
  });

  it("reads nothing when no language was stored", () => {
    expect(readLanguageCookie()).toBeUndefined();
  });

  it("reads back what it wrote", () => {
    writeLanguageCookie(Language.English);

    expect(readLanguageCookie()).toBe(Language.English);
  });

  it("finds the language among other cookies", () => {
    document.cookie = "theme=dark; path=/";
    writeLanguageCookie(Language.German);

    expect(readLanguageCookie()).toBe(Language.German);
  });

  it("ignores a stored value that is not a supported language", () => {
    document.cookie = "language=klingon; path=/";

    expect(readLanguageCookie()).toBeUndefined();
  });
});
