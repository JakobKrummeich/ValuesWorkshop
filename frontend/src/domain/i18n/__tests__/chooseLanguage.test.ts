import { chooseLanguage } from "../chooseLanguage";
import { Language } from "../language";

describe("choosing the language of a request", () => {
  it("prefers the stored choice over the browser preference", () => {
    expect(chooseLanguage("en", "de-DE,de;q=0.9")).toBe(Language.English);
  });

  it("falls back to the browser preference when nothing is stored", () => {
    expect(chooseLanguage(undefined, "en-GB,en;q=0.9")).toBe(Language.English);
  });

  it("ignores unsupported browser preferences", () => {
    expect(chooseLanguage(undefined, "fr-FR,fr;q=0.9,en;q=0.8")).toBe(
      Language.English,
    );
    expect(chooseLanguage(undefined, "fr-FR")).toBe(Language.German);
  });

  it("falls back to German without any signal", () => {
    expect(chooseLanguage(undefined, undefined)).toBe(Language.German);
  });

  it("ignores a stored value that is not a supported language", () => {
    expect(chooseLanguage("klingon", "en")).toBe(Language.English);
  });
});
