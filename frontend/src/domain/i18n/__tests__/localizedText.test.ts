import { Language } from "../language";
import { localizedText } from "../localizedText";

const text = { de: "Hallo", en: "Hello" };

describe("localized wire text", () => {
  it("picks the German variant", () => {
    expect(localizedText(Language.German, text)).toBe("Hallo");
  });

  it("picks the English variant", () => {
    expect(localizedText(Language.English, text)).toBe("Hello");
  });
});
