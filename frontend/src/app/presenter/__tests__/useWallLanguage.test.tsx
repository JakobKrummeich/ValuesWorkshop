import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Language } from "../../../domain/i18n/language";
import { LanguageProvider } from "../../i18n/LanguageProvider";
import { useTranslation } from "../../i18n/useTranslation";
import { useWallLanguage } from "../useWallLanguage";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider initialLanguage={Language.English}>
      {children}
    </LanguageProvider>
  );
}

function renderWall() {
  return renderHook(
    () => {
      useWallLanguage();
      return useTranslation().language;
    },
    { wrapper },
  );
}

describe("wall language", () => {
  beforeEach(() => {
    document.cookie = "language=; path=/; max-age=0";
    document.documentElement.lang = "en";
  });

  it("follows the language named in the link", () => {
    window.history.replaceState(
      {},
      "",
      "/presenter?sessionIdentity=s&language=de",
    );

    const { result } = renderWall();

    expect(result.current).toBe(Language.German);
    expect(document.documentElement.lang).toBe("de");
    expect(document.cookie).toContain("language=de");
  });

  it("keeps the current language when the link names none", () => {
    window.history.replaceState({}, "", "/presenter?sessionIdentity=s");

    const { result } = renderWall();

    expect(result.current).toBe(Language.English);
    expect(document.cookie).not.toContain("language=");
  });

  it("ignores a language it does not speak", () => {
    window.history.replaceState({}, "", "/presenter?language=fr");

    const { result } = renderWall();

    expect(result.current).toBe(Language.English);
  });
});
