import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { Language } from "../../../domain/i18n/language";
import { MessageKey } from "../../../domain/i18n/messages";
import { LanguageProvider } from "../LanguageProvider";
import { useTranslation } from "../useTranslation";

function providerWith(initialLanguage: Language) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LanguageProvider initialLanguage={initialLanguage}>
        {children}
      </LanguageProvider>
    );
  };
}

describe("the translation hook", () => {
  beforeEach(() => {
    document.cookie = "language=; path=/; max-age=0";
    document.documentElement.lang = "de";
  });

  it("translates into the language the request started with", () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: providerWith(Language.English),
    });

    expect(result.current.language).toBe(Language.English);
    expect(result.current.translate(MessageKey.ConnectionConnected)).toBe(
      "Connected",
    );
  });

  it("passes parameters through to the message", () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: providerWith(Language.German),
    });

    expect(
      result.current.translate(MessageKey.SessionPhase, { phase: 2 }),
    ).toBe("Phase 2");
  });

  it("switches language, remembers the choice and relabels the document", () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: providerWith(Language.German),
    });

    act(() => result.current.selectLanguage(Language.English));

    expect(result.current.language).toBe(Language.English);
    expect(result.current.translate(MessageKey.ConnectionConnected)).toBe(
      "Connected",
    );
    expect(document.cookie).toContain("language=en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("refuses to work outside the provider", () => {
    expect(() => renderHook(() => useTranslation())).toThrow(
      "useTranslation requires LanguageProvider",
    );
  });
});
