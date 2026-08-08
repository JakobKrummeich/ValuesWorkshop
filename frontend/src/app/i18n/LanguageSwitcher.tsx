"use client";

import styles from "./LanguageSwitcher.module.css";
import { useLanguageSwitcher } from "./useLanguageSwitcher";

export function LanguageSwitcher() {
  const { label, choices, selectLanguage } = useLanguageSwitcher();

  return (
    <div className={styles.switcher} role="group" aria-label={label}>
      {choices.map((choice) => (
        <button
          key={choice.language}
          type="button"
          className={styles.choice}
          aria-pressed={choice.isSelected}
          onClick={() => selectLanguage(choice.language)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
