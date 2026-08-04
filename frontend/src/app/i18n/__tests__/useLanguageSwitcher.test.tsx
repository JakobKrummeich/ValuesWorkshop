import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { Language } from "../../../domain/i18n/language";
import { LanguageProvider } from "../LanguageProvider";
import { useLanguageSwitcher } from "../useLanguageSwitcher";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider initialLanguage={Language.German}>
      {children}
    </LanguageProvider>
  );
}

describe("language switcher logic", () => {
  beforeEach(() => {
    document.cookie = "language=; path=/; max-age=0";
  });

  it("offers every language, labelled in the current one, with the current one selected", () => {
    const { result } = renderHook(() => useLanguageSwitcher(), { wrapper });

    expect(result.current.label).toBe("Sprache");
    expect(result.current.choices).toEqual([
      { language: Language.German, label: "Deutsch", isSelected: true },
      { language: Language.English, label: "Englisch", isSelected: false },
    ]);
  });

  it("relabels itself once another language is chosen", () => {
    const { result } = renderHook(() => useLanguageSwitcher(), { wrapper });

    act(() => result.current.selectLanguage(Language.English));

    expect(result.current.label).toBe("Language");
    expect(result.current.choices).toEqual([
      { language: Language.German, label: "German", isSelected: false },
      { language: Language.English, label: "English", isSelected: true },
    ]);
  });
});
