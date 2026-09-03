"use client";

import { useEffect } from "react";
import { requestedLanguage } from "../../adapters/browserLocation";
import { useTranslation } from "../i18n/useTranslation";

export function useWallLanguage(): void {
  const { selectLanguage } = useTranslation();

  useEffect(() => {
    const language = requestedLanguage();
    if (language !== undefined) {
      selectLanguage(language);
    }
  }, [selectLanguage]);
}
