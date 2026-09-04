"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import type { WorkshopValue } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./ValueTabs.module.css";

export function ValueTabs({
  values,
  selectedValueId,
  onSelect,
}: {
  values: WorkshopValue[];
  selectedValueId: string | null;
  onSelect: (valueId: string) => void;
}) {
  const { language } = useTranslation();

  return (
    <div className={styles.tabs} role="tablist" data-testid="value-tabs">
      {values.map((value) => (
        <button
          key={value.valueId}
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={value.valueId === selectedValueId}
          data-testid={`value-tab-${value.valueId}`}
          onClick={() => onSelect(value.valueId)}
        >
          {localizedText(language, value.text)}
        </button>
      ))}
    </div>
  );
}
