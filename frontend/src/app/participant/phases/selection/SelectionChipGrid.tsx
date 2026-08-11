"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./SelectionChipGrid.module.css";
import type { SelectionChip } from "./useParticipantSelectionScreen";

export function SelectionChipGrid({
  chips,
  onToggle,
}: {
  chips: SelectionChip[];
  onToggle: (valueId: string) => void;
}) {
  const { language } = useTranslation();

  return (
    <div className={styles.grid}>
      {chips.map((chip) => (
        <button
          key={chip.valueId}
          type="button"
          className={
            chip.isSelected ? `${styles.chip} ${styles.selected}` : styles.chip
          }
          data-testid={`value-chip-${chip.valueId}`}
          aria-pressed={chip.isSelected}
          disabled={chip.isDisabled}
          onClick={() => onToggle(chip.valueId)}
        >
          {localizedText(language, chip.text)}
        </button>
      ))}
    </div>
  );
}
